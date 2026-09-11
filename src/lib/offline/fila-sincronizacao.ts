import { abrirBanco, suportado, TABELA_FILA } from "./banco";

// Fila de sincronização (Fase 5, etapa 3): quando uma gravação (adicionar/
// remover camada, trecho de revestimento/cimentação/pré-filtro) falha por
// falta de rede, em vez de quebrar a tela ela é guardada aqui e reaplicada
// quando a conexão voltar (ver sincronizar.ts). Cada item guarda o `tipo`
// (chave pro registro em registro-acoes.ts) e o `payload` já como objeto
// simples (não FormData — IndexedDB até aceita, mas os formulários hoje só
// têm campos de texto, então não há necessidade de lidar com Blob/File
// aqui; revisar se a Fase 6 trouxer upload de arquivo por um desses
// formulários).

export type ItemFila = {
  id: string;
  tipo: string;
  pocoId: string;
  payload: Record<string, string>;
  criadoEm: string;
  tentativas: number;
  ultimoErro?: string;
};

// Não há notificação nativa de mudança em IndexedDB entre componentes —
// esse evento é o jeito simples de o indicador de conectividade saber que
// a contagem de pendências mudou sem precisar consultar o banco a cada
// re-render.
const EVENTO_FILA_MUDOU = "fila-offline-mudou";

function avisarMudanca() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENTO_FILA_MUDOU));
  }
}

export function ouvirMudancasNaFila(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENTO_FILA_MUDOU, callback);
  return () => window.removeEventListener(EVENTO_FILA_MUDOU, callback);
}

export function formDataParaObjeto(formData: FormData): Record<string, string> {
  const objeto: Record<string, string> = {};
  formData.forEach((valor, chave) => {
    objeto[chave] = String(valor);
  });
  return objeto;
}

export function objetoParaFormData(objeto: Record<string, string>): FormData {
  const formData = new FormData();
  Object.entries(objeto).forEach(([chave, valor]) => formData.append(chave, valor));
  return formData;
}

function gerarId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function enfileirar(
  item: Pick<ItemFila, "tipo" | "pocoId" | "payload">
): Promise<void> {
  if (!suportado()) {
    throw new Error(
      "Este aparelho não suporta armazenamento offline (IndexedDB) — não é possível guardar a alteração para sincronizar depois."
    );
  }
  const banco = await abrirBanco();

  const novoItem: ItemFila = {
    ...item,
    id: gerarId(),
    criadoEm: new Date().toISOString(),
    tentativas: 0,
  };

  await new Promise<void>((resolve, reject) => {
    const transacao = banco.transaction(TABELA_FILA, "readwrite");
    transacao.objectStore(TABELA_FILA).put(novoItem);
    transacao.oncomplete = () => resolve();
    transacao.onerror = () => reject(transacao.error);
  });

  banco.close();
  avisarMudanca();
}

export async function listarFila(pocoId?: string): Promise<ItemFila[]> {
  if (!suportado()) return [];
  const banco = await abrirBanco();

  const resultado = await new Promise<ItemFila[]>((resolve, reject) => {
    const transacao = banco.transaction(TABELA_FILA, "readonly");
    const pedido = transacao.objectStore(TABELA_FILA).getAll();
    pedido.onsuccess = () => resolve(pedido.result ?? []);
    pedido.onerror = () => reject(pedido.error);
  });

  banco.close();
  const ordenados = resultado.sort((a, b) => a.criadoEm.localeCompare(b.criadoEm));
  return pocoId ? ordenados.filter((item) => item.pocoId === pocoId) : ordenados;
}

export async function removerDaFila(id: string): Promise<void> {
  if (!suportado()) return;
  const banco = await abrirBanco();

  await new Promise<void>((resolve, reject) => {
    const transacao = banco.transaction(TABELA_FILA, "readwrite");
    transacao.objectStore(TABELA_FILA).delete(id);
    transacao.oncomplete = () => resolve();
    transacao.onerror = () => reject(transacao.error);
  });

  banco.close();
  avisarMudanca();
}

export async function registrarFalhaNaFila(id: string, erro: string): Promise<void> {
  if (!suportado()) return;
  const banco = await abrirBanco();

  await new Promise<void>((resolve, reject) => {
    const transacao = banco.transaction(TABELA_FILA, "readwrite");
    const tabela = transacao.objectStore(TABELA_FILA);
    const pedido = tabela.get(id);
    pedido.onsuccess = () => {
      const item = pedido.result as ItemFila | undefined;
      if (item) {
        tabela.put({ ...item, tentativas: item.tentativas + 1, ultimoErro: erro });
      }
    };
    pedido.onerror = () => reject(pedido.error);
    transacao.oncomplete = () => resolve();
    transacao.onerror = () => reject(transacao.error);
  });

  banco.close();
  avisarMudanca();
}
