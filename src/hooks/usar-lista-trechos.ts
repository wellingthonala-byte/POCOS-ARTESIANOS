"use client";

import { useActionState, useEffect, useMemo, useRef } from "react";
import { envolverAcaoComFilaOffline } from "@/lib/offline/envolver-acao";

type EstadoAcaoTrecho = { erro?: string; sucesso?: boolean; pendente?: boolean };

type AcaoTrecho = (
  estado: EstadoAcaoTrecho,
  formData: FormData
) => Promise<EstadoAcaoTrecho>;

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
    () => envolverAcaoComFilaOffline(acaoAdicionar, offline.tipoAdicionar, offline.pocoId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [offline.tipoAdicionar, offline.pocoId]
  );
  const acaoRemoverComFila = useMemo(
    () => envolverAcaoComFilaOffline(acaoRemover, offline.tipoRemover, offline.pocoId),
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
