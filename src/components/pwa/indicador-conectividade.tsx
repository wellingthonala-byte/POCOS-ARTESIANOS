"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listarFila, ouvirMudancasNaFila } from "@/lib/offline/fila-sincronizacao";
import { sincronizarFila } from "@/lib/offline/sincronizar";

// Indicador permanente de conectividade e de pendências de sincronização
// (Fase 5). Antes de montar no cliente não dá para saber o estado real da
// rede (navigator.onLine não existe no servidor), então assume "online" e
// "0 pendências" até o efeito rodar — evita divergência entre o HTML do
// servidor e a primeira renderização no cliente.
export function IndicadorConectividade() {
  const router = useRouter();
  const [online, setOnline] = useState(true);
  const [pendencias, setPendencias] = useState(0);
  const [sincronizando, setSincronizando] = useState(false);

  const atualizarPendencias = useCallback(() => {
    listarFila()
      .then((itens) => setPendencias(itens.length))
      .catch(() => {});
  }, []);

  const tentarSincronizar = useCallback(async () => {
    setSincronizando(true);
    try {
      const resultado = await sincronizarFila();
      if (resultado.sincronizados > 0) {
        router.refresh();
      }
    } finally {
      setSincronizando(false);
      atualizarPendencias();
    }
  }, [router, atualizarPendencias]);

  useEffect(() => {
    setOnline(navigator.onLine);
    atualizarPendencias();
    if (navigator.onLine) {
      tentarSincronizar();
    }

    function aoFicarOnline() {
      setOnline(true);
      tentarSincronizar();
    }
    function aoFicarOffline() {
      setOnline(false);
    }

    window.addEventListener("online", aoFicarOnline);
    window.addEventListener("offline", aoFicarOffline);
    const pararDeOuvir = ouvirMudancasNaFila(atualizarPendencias);
    return () => {
      window.removeEventListener("online", aoFicarOnline);
      window.removeEventListener("offline", aoFicarOffline);
      pararDeOuvir();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (online) {
    if (pendencias === 0) {
      return (
        <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 text-xs text-gray-500">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          Online
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800">
        <span className="h-2 w-2 rounded-full bg-blue-500" />
        {sincronizando
          ? "Sincronizando..."
          : `Online — ${pendencias} alteração(ões) aguardando sincronizar`}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900">
      <span className="h-2 w-2 rounded-full bg-amber-600" />
      Offline
      {pendencias > 0
        ? ` — ${pendencias} alteração(ões) guardada(s) neste aparelho, serão enviadas quando a internet voltar`
        : ""}
    </div>
  );
}
