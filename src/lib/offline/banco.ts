// Abertura do banco IndexedDB compartilhado entre o espelho de leitura
// (banco-local.ts) e a fila de sincronização (fila-sincronizacao.ts) — um
// único lugar define as tabelas, pra evitar duas chamadas de
// `indexedDB.open` com `onupgradeneeded` divergentes.

export const NOME_BANCO = "pocos-offline";
export const VERSAO_BANCO = 2;
export const TABELA_POCOS = "pocos";
export const TABELA_FILA = "fila";

export function suportado(): boolean {
  return typeof window !== "undefined" && "indexedDB" in window;
}

export function abrirBanco(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const pedido = indexedDB.open(NOME_BANCO, VERSAO_BANCO);
    pedido.onupgradeneeded = () => {
      const banco = pedido.result;
      if (!banco.objectStoreNames.contains(TABELA_POCOS)) {
        banco.createObjectStore(TABELA_POCOS, { keyPath: "id" });
      }
      if (!banco.objectStoreNames.contains(TABELA_FILA)) {
        banco.createObjectStore(TABELA_FILA, { keyPath: "id" });
      }
    };
    pedido.onsuccess = () => resolve(pedido.result);
    pedido.onerror = () => reject(pedido.error);
  });
}
