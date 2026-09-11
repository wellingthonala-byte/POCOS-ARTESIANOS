import {
  adicionarCamadaLitologica,
  removerUltimaCamadaLitologica,
  adicionarRevestimento,
  removerUltimoRevestimento,
  adicionarCimentacao,
  removerUltimaCimentacao,
  adicionarPreFiltro,
  removerUltimoPreFiltro,
  atualizarIdentificacaoLocacao,
  atualizarPerfuracao,
  atualizarNiveisVazao,
  type EstadoFormularioPoco,
} from "@/app/pocos/acoes";

type AcaoBruta = (
  pocoId: string,
  estadoAnterior: EstadoFormularioPoco,
  formData: FormData
) => Promise<EstadoFormularioPoco>;

// Mapa tipo → server action "crua" (sem o pocoId já aplicado com .bind),
// usado tanto para enfileirar (o tipo vira a chave gravada no IndexedDB)
// quanto para reaplicar quando a conexão volta (sincronizar.ts). Cada
// entrada nova em useListaTrechos/useAutosavePoco (ou qualquer outra tela
// que passe a usar envolverAcaoComFilaOffline) precisa de uma linha aqui.
//
// `criarPoco` (criação de poço novo) de propósito NÃO está aqui: precisa
// de um ID gerado no servidor pra navegar pra próxima etapa, o que não dá
// pra ter offline sem um mecanismo de ID temporário + reconciliação depois
// — ainda não implementado (ver CLAUDE.md).
export const registroAcoesOffline: Record<string, AcaoBruta> = {
  "identificacao.atualizar": atualizarIdentificacaoLocacao,
  "perfuracao.atualizar": atualizarPerfuracao,
  "niveisVazao.atualizar": atualizarNiveisVazao,
  "litologia.adicionar": adicionarCamadaLitologica,
  "litologia.remover": removerUltimaCamadaLitologica,
  "revestimento.adicionar": adicionarRevestimento,
  "revestimento.remover": removerUltimoRevestimento,
  "cimentacao.adicionar": adicionarCimentacao,
  "cimentacao.remover": removerUltimaCimentacao,
  "preFiltro.adicionar": adicionarPreFiltro,
  "preFiltro.remover": removerUltimoPreFiltro,
};
