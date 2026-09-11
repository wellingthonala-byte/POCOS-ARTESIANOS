import type { CamadaPerfil } from "@/lib/perfil/litologico";
import type { DadosConstrutivo } from "@/lib/perfil/construtivo";

// Espelho local (IndexedDB) dos poços já abertos com internet, para
// consulta offline (Fase 5, etapa 2). É só leitura: lançar/editar dado
// ainda exige conexão (isso é a próxima etapa, a fila de sincronização) —
// aqui a única escrita é o próprio espelhamento, disparado pelas telas
// normais quando carregam com sucesso.
//
// Um mesmo poço pode ser gravado de duas formas — resumo (pela lista de
// poços) ou detalhe completo (pela tela do poço) — por isso `salvarPocoOffline`
// faz merge com o que já existe em vez de sobrescrever, pra visitar a lista
// depois de já ter visto o detalhe não apagar litologia/construtivo já
// espelhados.

const NOME_BANCO = "pocos-offline";
const VERSAO_BANCO = 1;
const NOME_TABELA = "pocos";

export type PocoOffline = {
  id: string;
  identificacao: string;
  status: string;
  obraNome: string;
  clienteNome: string;
  municipio: string | null;
  uf: string | null;
  profundidadeFinalTexto: string | null;
  atualizadoEmLocal: string; // ISO — quando este espelho foi salvo neste aparelho
  camadas?: CamadaPerfil[];
  construtivo?: DadosConstrutivo;
  profundidadeTotal?: number;
};

function suportado(): boolean {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function abrirBanco(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const pedido = indexedDB.open(NOME_BANCO, VERSAO_BANCO);
    pedido.onupgradeneeded = () => {
      const banco = pedido.result;
      if (!banco.objectStoreNames.contains(NOME_TABELA)) {
        banco.createObjectStore(NOME_TABELA, { keyPath: "id" });
      }
    };
    pedido.onsuccess = () => resolve(pedido.result);
    pedido.onerror = () => reject(pedido.error);
  });
}

export async function salvarPocoOffline(
  dados: Omit<PocoOffline, "atualizadoEmLocal">
): Promise<void> {
  if (!suportado()) return;
  const banco = await abrirBanco();

  await new Promise<void>((resolve, reject) => {
    const transacao = banco.transaction(NOME_TABELA, "readwrite");
    const tabela = transacao.objectStore(NOME_TABELA);
    const pedidoAtual = tabela.get(dados.id);

    pedidoAtual.onsuccess = () => {
      const existente = pedidoAtual.result as PocoOffline | undefined;
      const mesclado: PocoOffline = {
        ...existente,
        ...dados,
        atualizadoEmLocal: new Date().toISOString(),
      };
      tabela.put(mesclado);
    };
    pedidoAtual.onerror = () => reject(pedidoAtual.error);

    transacao.oncomplete = () => resolve();
    transacao.onerror = () => reject(transacao.error);
  });

  banco.close();
}

export async function buscarPocoOffline(
  id: string
): Promise<PocoOffline | undefined> {
  if (!suportado()) return undefined;
  const banco = await abrirBanco();

  const resultado = await new Promise<PocoOffline | undefined>((resolve, reject) => {
    const transacao = banco.transaction(NOME_TABELA, "readonly");
    const pedido = transacao.objectStore(NOME_TABELA).get(id);
    pedido.onsuccess = () => resolve(pedido.result);
    pedido.onerror = () => reject(pedido.error);
  });

  banco.close();
  return resultado;
}

export async function listarPocosOffline(): Promise<PocoOffline[]> {
  if (!suportado()) return [];
  const banco = await abrirBanco();

  const resultado = await new Promise<PocoOffline[]>((resolve, reject) => {
    const transacao = banco.transaction(NOME_TABELA, "readonly");
    const pedido = transacao.objectStore(NOME_TABELA).getAll();
    pedido.onsuccess = () => resolve(pedido.result ?? []);
    pedido.onerror = () => reject(pedido.error);
  });

  banco.close();
  return resultado.sort((a, b) => a.identificacao.localeCompare(b.identificacao));
}
