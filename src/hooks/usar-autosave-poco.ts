"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { enfileirar, formDataParaObjeto } from "@/lib/offline/fila-sincronizacao";
import { ehErroDeRede } from "@/lib/offline/envolver-acao";

type EstadoAutosave = { erro?: string; sucesso?: boolean };
type StatusAutosave = "ocioso" | "salvo" | "erro" | "pendente";

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
 * servidor, então não tem como a própria action tratar isso).
 */
export function useAutosavePoco<V extends Record<string, string>>(
  valoresIniciais: V,
  acao: (estado: EstadoAutosave, formData: FormData) => Promise<EstadoAutosave>,
  offline: { pocoId: string; tipo: string },
  atrasoMs = 800
) {
  const [valores, setValores] = useState(valoresIniciais);
  const [emAndamento, iniciarTransicao] = useTransition();
  const [status, setStatus] = useState<StatusAutosave>("ocioso");
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const montado = useRef(false);

  function salvar(valoresParaSalvar: V, aoConcluir?: () => void) {
    const formData = new FormData();
    Object.entries(valoresParaSalvar).forEach(([chave, valor]) =>
      formData.set(chave, valor)
    );

    iniciarTransicao(async () => {
      try {
        const resultado = await acao({}, formData);
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
          await enfileirar({
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
