"use client";

import { useEffect, useState } from "react";

// Indicador permanente de conectividade (Fase 5). Antes de montar no
// cliente não dá para saber o estado real da rede (navigator.onLine não
// existe no servidor), então assume "online" até o efeito rodar — evita
// divergência entre o HTML do servidor e a primeira renderização no
// cliente.
export function IndicadorConectividade() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);

    function aoFicarOnline() {
      setOnline(true);
    }
    function aoFicarOffline() {
      setOnline(false);
    }

    window.addEventListener("online", aoFicarOnline);
    window.addEventListener("offline", aoFicarOffline);
    return () => {
      window.removeEventListener("online", aoFicarOnline);
      window.removeEventListener("offline", aoFicarOffline);
    };
  }, []);

  if (online) {
    return (
      <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 text-xs text-gray-500">
        <span className="h-2 w-2 rounded-full bg-green-500" />
        Online
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900">
      <span className="h-2 w-2 rounded-full bg-amber-600" />
      Offline — os dados lançados agora ainda não têm sincronização
      automática
    </div>
  );
}
