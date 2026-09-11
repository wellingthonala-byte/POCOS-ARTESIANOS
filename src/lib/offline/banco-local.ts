import type { CamadaPerfil } from "@/lib/perfil/litologico";
import type { DadosConstrutivo } from "@/lib/perfil/construtivo";
import { abrirBanco, suportado, TABELA_POCOS } from "./banco";

// Espelho local (IndexedDB) dos poços já abertos com internet, para
// consulta offline (Fase 5, etapa 2). É só leitura para o poço em si — a
// escrita de dado novo (etapa 3) passa pela fila de sincronização
// (fila-sincronizacao.ts), não por aqui.
//
// Um mesmo poço pode ser gravado de duas formas — resumo (pela lista de
// poços) ou detalhe completo (pela tela do poço) — por isso `salvarPocoOffline`
// faz merge com o que já existe em vez de sobrescrever, pra visitar a lista
// depois de já ter visto o detalhe não apagar litologia/construtivo já
// espelhados.

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

export async function salvarPocoOffline(
  dados: Omit<PocoOffline, "atualizadoEmLocal">
): Promise<void> {
  if (!suportado()) return;
  const banco = await abrirBanco();

  await new Promise<void>((resolve, reject) => {
    const transacao = banco.transaction(TABELA_POCOS, "readwrite");
    const tabela = transacao.objectStore(TABELA_POCOS);
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
    const transacao = banco.transaction(TABELA_POCOS, "readonly");
    const pedido = transacao.objectStore(TABELA_POCOS).get(id);
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
    const transacao = banco.transaction(TABELA_POCOS, "readonly");
    const pedido = transacao.objectStore(TABELA_POCOS).getAll();
    pedido.onsuccess = () => resolve(pedido.result ?? []);
    pedido.onerror = () => reject(pedido.error);
  });

  banco.close();
  return resultado.sort((a, b) => a.identificacao.localeCompare(b.identificacao));
}
