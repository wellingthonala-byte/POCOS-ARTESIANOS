"use client";

import { useEffect } from "react";
import { salvarPocoOffline, type PocoOffline } from "@/lib/offline/banco-local";

// Só o efeito de espelhar o poço aberto agora (com internet) em IndexedDB,
// pra consulta offline depois. Não renderiza nada.
export function EspelharPocoOffline({
  dados,
}: {
  dados: Omit<PocoOffline, "atualizadoEmLocal">;
}) {
  useEffect(() => {
    salvarPocoOffline(dados).catch((erro) => {
      console.error("Falha ao espelhar poço para uso offline:", erro);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(dados)]);

  return null;
}
