"use client";

import { useActionState, useEffect, useRef } from "react";

type EstadoAcaoTrecho = { erro?: string; sucesso?: boolean };

/**
 * Wiring comum às listas de trechos encadeados (litologia, revestimento,
 * cimentação, pré-filtro): adicionar limpa o formulário e devolve o foco
 * para o primeiro campo, pronto para lançar o próximo trecho em sequência.
 */
export function useListaTrechos(
  acaoAdicionar: (
    estado: EstadoAcaoTrecho,
    formData: FormData
  ) => Promise<EstadoAcaoTrecho>,
  acaoRemover: (
    estado: EstadoAcaoTrecho,
    formData: FormData
  ) => Promise<EstadoAcaoTrecho>,
  estadoInicial: EstadoAcaoTrecho
) {
  const [estadoAdicionar, adicionar, adicionando] = useActionState(
    acaoAdicionar,
    estadoInicial
  );
  const [estadoRemover, remover, removendo] = useActionState(
    acaoRemover,
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
