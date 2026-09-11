"use client";

import { useEffect } from "react";
import { salvarPocoOffline, type PocoOffline } from "@/lib/offline/banco-local";

type ResumoPoco = Omit<
  PocoOffline,
  "atualizadoEmLocal" | "camadas" | "construtivo" | "profundidadeTotal"
>;

// Espelha o resumo de cada poço da lista em IndexedDB, pra tela offline
// mostrar pelo menos identificação/status/obra mesmo de poços cujo detalhe
// nunca foi aberto. Faz merge com o que já existir — nunca apaga
// litologia/construtivo já espelhados pela tela de detalhe.
export function EspelharListaPocosOffline({ pocos }: { pocos: ResumoPoco[] }) {
  useEffect(() => {
    pocos.forEach((poco) => {
      salvarPocoOffline(poco).catch((erro) => {
        console.error("Falha ao espelhar lista de poços para uso offline:", erro);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(pocos)]);

  return null;
}
