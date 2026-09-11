"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Guarda os valores do formulário no localStorage a cada alteração e
 * restaura ao montar. Placeholder simples até a Fase 5 (fila offline com
 * IndexedDB) — os campos obrigatórios do poço não aceitam nulo, então um
 * rascunho incompleto não pode ser salvo no banco ainda.
 */
export function useRascunhoFormulario<T extends Record<string, unknown>>(
  chave: string | null,
  valoresPadrao: T
) {
  const [valores, setValores] = useState<T>(valoresPadrao);
  const carregouRascunho = useRef(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rascunhoLimpo = useRef(false);

  useEffect(() => {
    if (!chave || carregouRascunho.current) return;
    carregouRascunho.current = true;
    try {
      const salvo = window.localStorage.getItem(chave);
      if (salvo) {
        setValores((atual) => ({ ...atual, ...JSON.parse(salvo) }));
      }
    } catch {
      // Rascunho corrompido ou localStorage indisponível — segue com os valores padrão.
    }
  }, [chave]);

  useEffect(() => {
    if (!chave || rascunhoLimpo.current) return;
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => {
      try {
        window.localStorage.setItem(chave, JSON.stringify(valores));
      } catch {
        // Armazenamento indisponível (ex.: modo privado) — segue sem persistir o rascunho.
      }
    }, 400);
    return () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, [chave, valores]);

  const limparRascunho = useCallback(() => {
    if (!chave) return;
    rascunhoLimpo.current = true;
    if (temporizador.current) {
      clearTimeout(temporizador.current);
      temporizador.current = null;
    }
    try {
      window.localStorage.removeItem(chave);
    } catch {
      // Nada a fazer se o armazenamento não estiver disponível.
    }
  }, [chave]);

  return { valores, setValores, limparRascunho };
}
