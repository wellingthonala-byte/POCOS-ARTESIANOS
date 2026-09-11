"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { enfileirarOuSubstituir, formDataParaObjeto } from "@/lib/offline/fila-sincronizacao";
import { ehErroDeRede } from "@/lib/offline/envolver-acao";

type EstadoAutosave = {
  erro?: string;
  sucesso?: boolean;
  conflito?: boolean;
  atualizadoEm?: string;
};
type StatusAutosave = "ocioso" | "salvo" | "erro" | "pendente" | "conflito";

/**
 * Autosave com debounce compartilhado pelas etapas cujos campos são
 * opcionais e o poço já existe (perfuração, níveis e vazão — ver
 * `FormularioPerfuracao`/`FormularioNiveisVazao`): grava direto no banco a
 * cada alteração, sem passar por rascunho em localStorage (diferente da
 * etapa 1, ver `usar-rascunho-formulario.ts`).
 *
 * Se a gravação falhar por falta de rede, guarda a tentativa na fila de
 * sincronização (Fase 5, etapa 3) em vez de deixar o erro estourar sem
 * tratamento — sem isso, editar um campo sem conexão quebra a tela com
 * "Application error" (a chamada da server action nem chega a rodar no
 * servidor, então não tem como a própria action tratar isso). Cada
 * gravação manda junto o último `atualizadoEm` conhecido do registro
 * (`baseAtualizadoEm`), pra action detectar conflito (Fase 5, etapa 4) —
 * ver `aplicarComVerificacaoDeConflito` em `acoes.ts`.
 */
export function useAutosavePoco<V extends Record<string, string>>(
  valoresIniciais: V,
  atualizadoEmInicial: string | null,
  acao: (estado: EstadoAutosave, formData: FormData) => Promise<EstadoAutosave>,
  offline: { pocoId: string; tipo: string },
  atrasoMs = 800
) {
  const [valores, setValores] = useState(valoresIniciais);
  const [emAndamento, iniciarTransicao] = useTransition();
  const [status, setStatus] = useState<StatusAutosave>("ocioso");
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const montado = useRef(false);
  // Não é estado porque não deve disparar re-render — só precisa estar
  // certo na hora do próximo `salvar`. Só avança quando a gravação realmente
  // aplicou no servidor: se deu conflito, fica parado no valor antigo de
  // propósito, pra uma nova tentativa (mesmo manual) continuar acusando o
  // conflito em vez de sobrescrever por trás do usuário na segunda tentativa.
  const ultimoAtualizadoEmConhecido = useRef(atualizadoEmInicial);

  function salvar(valoresParaSalvar: V, aoConcluir?: () => void) {
    const formData = new FormData();
    Object.entries(valoresParaSalvar).forEach(([chave, valor]) =>
      formData.set(chave, valor)
    );
    if (ultimoAtualizadoEmConhecido.current) {
      formData.set("baseAtualizadoEm", ultimoAtualizadoEmConhecido.current);
    }

    iniciarTransicao(async () => {
      try {
        const resultado = await acao({}, formData);

        if (resultado.conflito) {
          setStatus("conflito");
          setMensagemErro(null);
          return;
        }
        if (resultado.atualizadoEm) {
          ultimoAtualizadoEmConhecido.current = resultado.atualizadoEm;
        }
        if (resultado.erro) {
          setStatus("erro");
          setMensagemErro(resultado.erro);
          return;
        }
        setStatus("salvo");
        setMensagemErro(null);
        aoConcluir?.();
      } catch (erro) {
        if (!ehErroDeRede(erro)) throw erro;

        try {
          await enfileirarOuSubstituir({
            tipo: offline.tipo,
            pocoId: offline.pocoId,
            payload: formDataParaObjeto(formData),
          });
          setStatus("pendente");
          setMensagemErro(null);
          aoConcluir?.();
        } catch {
          setStatus("erro");
          setMensagemErro(
            "Sem conexão e não foi possível guardar a alteração neste aparelho para sincronizar depois."
          );
        }
      }
    });
  }

  useEffect(() => {
    if (!montado.current) {
      montado.current = true;
      return;
    }
    const temporizador = setTimeout(() => salvar(valores), atrasoMs);
    return () => clearTimeout(temporizador);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valores]);

  function atualizarCampo<C extends keyof V>(campo: C, valor: V[C]) {
    setValores((atual) => ({ ...atual, [campo]: valor }));
  }

  return {
    valores,
    atualizarCampo,
    salvar,
    emAndamento,
    status,
    mensagemErro,
  };
}
