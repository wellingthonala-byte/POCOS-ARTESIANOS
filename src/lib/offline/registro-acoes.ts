import {
  adicionarCamadaLitologica,
  removerUltimaCamadaLitologica,
  adicionarRevestimento,
  removerUltimoRevestimento,
  adicionarCimentacao,
  removerUltimaCimentacao,
  adicionarPreFiltro,
  removerUltimoPreFiltro,
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
// entrada nova em useListaTrechos (litologia, revestimento, cimentação,
// pré-filtro) precisa de uma linha aqui com o mesmo par de tipos.
export const registroAcoesOffline: Record<string, AcaoBruta> = {
  "litologia.adicionar": adicionarCamadaLitologica,
  "litologia.remover": removerUltimaCamadaLitologica,
  "revestimento.adicionar": adicionarRevestimento,
  "revestimento.remover": removerUltimoRevestimento,
  "cimentacao.adicionar": adicionarCimentacao,
  "cimentacao.remover": removerUltimaCimentacao,
  "preFiltro.adicionar": adicionarPreFiltro,
  "preFiltro.remover": removerUltimoPreFiltro,
};
