import { SCRIPT_OFFLINE } from "./script-offline";

// Fallback que o service worker serve pra qualquer navegação que falhe sem
// cache (ver public/service-worker.js). De propósito NÃO é um componente
// cliente do Next (sem "use client", sem hooks): isso evitaria um chunk JS
// próprio dessa rota, que nunca teria sido buscado numa visita anterior
// (ninguém abre /offline enquanto está online) e por isso falharia
// exatamente no momento em que mais se precisa dele. Em vez disso, a lógica
// de olhar o IndexedDB (Fase 5, etapa 2) e trocar o conteúdo por
// identificação/status/perfil do poço já espelhado é um script vanilla
// embutido inline no próprio HTML desta página — ver `script-offline.ts`.
export default function PaginaOffline() {
  return (
    <main className="mx-auto max-w-2xl p-4 pb-24">
      <div id="conteudo-offline">
        <h1 className="text-2xl font-bold">Sem conexão</h1>
        <p className="mt-4 text-gray-600">
          Esta página ainda não tinha sido carregada antes, então não está
          disponível sem internet. Assim que a conexão voltar, tente de novo.
        </p>
      </div>
      <script dangerouslySetInnerHTML={{ __html: SCRIPT_OFFLINE }} />
    </main>
  );
}
