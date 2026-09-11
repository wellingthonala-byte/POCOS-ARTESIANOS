"use client";

import { useActionState, useEffect, useMemo, useRef } from "react";
import { enfileirar, formDataParaObjeto } from "@/lib/offline/fila-sincronizacao";

type EstadoAcaoTrecho = { erro?: string; sucesso?: boolean; pendente?: boolean };

type AcaoTrecho = (
  estado: EstadoAcaoTrecho,
  formData: FormData
) => Promise<EstadoAcaoTrecho>;

function ehErroDeRede(erro: unknown): boolean {
  // Servidor inalcançável (offline, ou caiu no meio da requisição) sempre
  // chega aqui como TypeError — é o erro padrão da Fetch API pra "não deu
  // nem pra tentar a requisição". Um erro de validação da própria action
  // (ex.: profundidade inválida) nunca lança — ela sempre devolve
  // `{ erro: "..." }` normalmente, então não é confundido com isso aqui.
  return erro instanceof TypeError;
}

// Envolve a action real: se a chamada falhar por falta de rede, guarda a
// tentativa na fila de sincronização (Fase 5, etapa 3) em vez de deixar o
// erro estourar sem tratamento — sem isso, submeter um formulário sem
// conexão quebra a tela inteira com "Application error" (o Next não tem
// tratamento próprio pra uma Server Action que nem consegue completar a
// requisição).
function envolverComFilaOffline(
  acao: AcaoTrecho,
  tipo: string,
  pocoId: string
): AcaoTrecho {
  return async (estadoAnterior, formData) => {
    try {
      return await acao(estadoAnterior, formData);
    } catch (erro) {
      if (!ehErroDeRede(erro)) throw erro;

      try {
        await enfileirar({ tipo, pocoId, payload: formDataParaObjeto(formData) });
      } catch {
        return {
          erro: "Sem conexão e não foi possível guardar a alteração neste aparelho para sincronizar depois.",
        };
      }
      return { sucesso: true, pendente: true };
    }
  };
}

/**
 * Wiring comum às listas de trechos encadeados (litologia, revestimento,
 * cimentação, pré-filtro): adicionar limpa o formulário e devolve o foco
 * para o primeiro campo, pronto para lançar o próximo trecho em sequência.
 * `tipoAdicionar`/`tipoRemover` identificam a action na fila de
 * sincronização offline (ver `registro-acoes.ts`) — precisam bater com as
 * chaves cadastradas lá.
 */
export function useListaTrechos(
  acaoAdicionar: AcaoTrecho,
  acaoRemover: AcaoTrecho,
  estadoInicial: EstadoAcaoTrecho,
  offline: { pocoId: string; tipoAdicionar: string; tipoRemover: string }
) {
  const acaoAdicionarComFila = useMemo(
    () => envolverComFilaOffline(acaoAdicionar, offline.tipoAdicionar, offline.pocoId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [offline.tipoAdicionar, offline.pocoId]
  );
  const acaoRemoverComFila = useMemo(
    () => envolverComFilaOffline(acaoRemover, offline.tipoRemover, offline.pocoId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [offline.tipoRemover, offline.pocoId]
  );

  const [estadoAdicionar, adicionar, adicionando] = useActionState(
    acaoAdicionarComFila,
    estadoInicial
  );
  const [estadoRemover, remover, removendo] = useActionState(
    acaoRemoverComFila,
    estadoInicial
  );

  const formularioRef = useRef<HTMLFormElement>(null);
  const primeiroCampoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (estadoAdicionar.sucesso) {
      formularioRef.current?.reset();
      primeiroCampoRef.current?.focus();
    }
  }, [estadoAdicionar]);

  return {
    estadoAdicionar,
    adicionar,
    adicionando,
    estadoRemover,
    remover,
    removendo,
    formularioRef,
    primeiroCampoRef,
  };
}
