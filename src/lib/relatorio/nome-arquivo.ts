export function nomeArquivoRelatorio(
  identificacao: string,
  extensao: "pdf" | "xlsx"
): string {
  const data = new Date().toISOString().slice(0, 10);
  const identificacaoLimpa = identificacao.replace(/[^a-zA-Z0-9-]/g, "-");
  return `relatorio-poco-${identificacaoLimpa}-${data}.${extensao}`;
}
