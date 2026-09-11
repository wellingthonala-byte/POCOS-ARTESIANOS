"use client";

import { useEffect } from "react";

// Só o efeito colateral de registrar o service worker — não renderiza nada.
export function RegistrarServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/service-worker.js").catch((erro) => {
      console.error("Falha ao registrar o service worker:", erro);
    });
  }, []);

  return null;
}
