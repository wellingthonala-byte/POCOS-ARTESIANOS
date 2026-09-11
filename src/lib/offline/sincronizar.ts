import {
  listarFila,
  removerDaFila,
  registrarFalhaNaFila,
  objetoParaFormData,
} from "./fila-sincronizacao";
import { registroAcoesOffline } from "./registro-acoes";

export type ResultadoSincronizacao = { sincronizados: number; falhas: number };

// Reaplica a fila de sincronização quando a conexão volta (Fase 5,
// etapa 3). Processa a fila agrupada por poço, em ordem de criação dentro
// de cada grupo: os itens de um mesmo poço formam uma cadeia (ex.:
// "adicionar camada" seguido de "remover última camada" só faz sentido
// nessa ordem), então a primeira falha PARA a cadeia daquele poço — os
// itens seguintes dele ficam na fila pra próxima tentativa — mas não trava
// a sincronização dos outros poços, que são independentes.
export async function sincronizarFila(): Promise<ResultadoSincronizacao> {
  const itens = await listarFila();
  const porPoco = new Map<string, typeof itens>();
  itens.forEach((item) => {
    const lista = porPoco.get(item.pocoId) ?? [];
    lista.push(item);
    porPoco.set(item.pocoId, lista);
  });

  let sincronizados = 0;
  let falhas = 0;

  for (const itensDoPoco of porPoco.values()) {
    for (const item of itensDoPoco) {
      const acao = registroAcoesOffline[item.tipo];
      if (!acao) {
        // Tipo desconhecido não deveria acontecer — remove pra não travar
        // a fila pra sempre com um item que nenhum código mais processa.
        await removerDaFila(item.id);
        continue;
      }

      try {
        const resultado = await acao(item.pocoId, {}, objetoParaFormData(item.payload));
        if (resultado?.erro) {
          await registrarFalhaNaFila(item.id, resultado.erro);
          falhas++;
          break;
        }
        await removerDaFila(item.id);
        sincronizados++;
      } catch (erro) {
        await registrarFalhaNaFila(
          item.id,
          erro instanceof Error ? erro.message : "Falha ao sincronizar."
        );
        falhas++;
        break;
      }
    }
  }

  return { sincronizados, falhas };
}
