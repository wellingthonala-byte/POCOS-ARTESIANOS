import { join } from "node:path";
import { readFile } from "node:fs/promises";

// Armazenamento local em disco, fora de `public/` (facilita controlar
// acesso quando a autenticação existir, e mantém upload de usuário
// separado do pipeline de asset estático do Next) — consistente com a
// preferência do projeto por solução direta em vez de dependência nova
// (service worker e SVGs do perfil/gráficos também são feitos à mão).
// Servido via Route Handler (src/app/pocos/[id]/anexos/[anexoId]/arquivo),
// nunca por caminho estático direto.
const DIRETORIO_UPLOADS = join(process.cwd(), "uploads");

export function caminhoDiretorioAnexos(pocoId: string): string {
  return join(DIRETORIO_UPLOADS, pocoId);
}

// O nome físico do arquivo é `<id do anexo><extensão>` — nunca o nome
// original do upload — porque o id já é garantidamente único (gerado pelo
// servidor) e evita qualquer problema de caractere especial/espaço/
// caminho no nome que o usuário escolheu. O nome original fica só no
// campo `nomeArquivo` do banco, usado para o Content-Disposition no
// download e para reencontrar a extensão ao servir o arquivo.
export function caminhoArquivoAnexo(
  pocoId: string,
  anexoId: string,
  extensao: string
): string {
  return join(caminhoDiretorioAnexos(pocoId), `${anexoId}${extensao}`);
}

// Extensão aceita → tipo MIME. Lista pequena e fechada de propósito: o
// técnico pode fotografar uma ART em papel (imagem) ou anexar o PDF
// original — por isso imagem e PDF são aceitos independente do `tipo`
// (foto/art/croqui/laudo/outro) escolhido, sem checagem cruzada.
export const extensoesAceitas: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".heic": "image/heic",
  ".heif": "image/heic",
  ".pdf": "application/pdf",
};

// Tamanho pensado pra foto de câmera de celular com folga (ver
// next.config.ts, que precisa de um limite de corpo de Server Action
// maior que o padrão do Next para caber um upload desse tamanho).
export const TAMANHO_MAXIMO_ANEXO_BYTES = 15 * 1024 * 1024;

export function obterExtensaoValidada(nomeArquivo: string): string {
  const combinacao = nomeArquivo.toLowerCase().match(/\.[a-z0-9]+$/);
  const extensao = combinacao ? combinacao[0] : "";
  if (!extensao || !(extensao in extensoesAceitas)) {
    throw new Error(
      "Envie uma foto (JPG, PNG, WEBP ou HEIC) ou um PDF."
    );
  }
  return extensao;
}

// Usado só pelo relatório em PDF (template.ts), pra embutir a foto marcada
// com `incluirNoRelatorio` direto no HTML que vai pro Puppeteer — mais
// simples que fazer o Chromium buscar a Route Handler de volta pela rede
// (ver decisão equivalente do desenho do perfil, que também é gerado como
// string e injetado direto, sem round-trip HTTP). Retorna null (em vez de
// lançar) se o arquivo não for imagem ou tiver sumido do disco — uma foto
// que falha não deve derrubar a geração do relatório inteiro.
export async function lerAnexoComoDataUri(
  pocoId: string,
  anexoId: string,
  nomeArquivo: string
): Promise<string | null> {
  try {
    const extensao = obterExtensaoValidada(nomeArquivo);
    const mime = extensoesAceitas[extensao];
    if (!mime.startsWith("image/")) return null;
    const bytes = await readFile(caminhoArquivoAnexo(pocoId, anexoId, extensao));
    return `data:${mime};base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

// Nome ASCII-seguro pro cabeçalho Content-Disposition — mesmo raciocínio
// de nomeArquivoRelatorio (relatorio/nome-arquivo.ts): evita lidar com
// RFC 5987 (filename*=UTF-8''...) só pra um nome de exibição.
export function nomeArquivoParaDownload(nomeArquivo: string): string {
  return nomeArquivo.replace(/[^a-zA-Z0-9.\-_]/g, "-");
}
