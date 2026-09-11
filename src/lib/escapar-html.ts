// Usado sempre que texto digitado pelo usuário (descrição de camada, nome,
// material etc.) é interpolado em HTML/SVG montado como string — sem o
// escape automático do JSX, precisamos fazer isso manualmente.
export function escaparHtml(valor: string): string {
  return valor
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
