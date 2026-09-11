// Service worker do app shell (Fase 5, etapa 1). Cuidado: aqui só entram
// arquivos verdadeiramente estáticos (ícones, manifest, assets do Next) e a
// página de fallback offline — nenhuma página com dado de poço é cacheada
// por aqui, porque isso arriscaria mostrar dado desatualizado para o
// técnico em campo. O espelhamento de dado para uso offline de verdade fica
// para a próxima etapa (IndexedDB + fila de sincronização).

const VERSAO_CACHE = "shell-v1";

const ARQUIVOS_APP_SHELL = [
  "/offline",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches
      .open(VERSAO_CACHE)
      .then((cache) => cache.addAll(ARQUIVOS_APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nomes) =>
        Promise.all(
          nomes
            .filter((nome) => nome !== VERSAO_CACHE)
            .map((nome) => caches.delete(nome))
        )
      )
      .then(() => self.clients.claim())
  );
});

function ehAssetEstatico(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.json"
  );
}

self.addEventListener("fetch", (evento) => {
  const requisicao = evento.request;
  if (requisicao.method !== "GET") return;

  const url = new URL(requisicao.url);
  if (url.origin !== self.location.origin) return;

  // Navegação de página: tenta rede primeiro (dado sempre fresco quando há
  // internet); só cai para cache/fallback quando a rede falha de verdade.
  if (requisicao.mode === "navigate") {
    evento.respondWith(
      fetch(requisicao).catch(() =>
        caches
          .match(requisicao)
          .then((resposta) => resposta || caches.match("/offline"))
      )
    );
    return;
  }

  // Asset estático: cache-first, populando o cache na primeira vez que
  // passa pela rede.
  if (ehAssetEstatico(url)) {
    evento.respondWith(
      caches.match(requisicao).then((respostaCache) => {
        if (respostaCache) return respostaCache;
        return fetch(requisicao).then((respostaRede) => {
          const copia = respostaRede.clone();
          caches.open(VERSAO_CACHE).then((cache) => cache.put(requisicao, copia));
          return respostaRede;
        });
      })
    );
  }
});
