import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  caminhoArquivoAnexo,
  extensoesAceitas,
  nomeArquivoParaDownload,
  obterExtensaoValidada,
} from "@/lib/anexos/armazenamento";

export async function GET(
  _requisicao: Request,
  { params }: { params: Promise<{ id: string; anexoId: string }> }
) {
  const { id, anexoId } = await params;

  const anexo = await prisma.anexo.findFirst({
    where: { id: anexoId, pocoId: id, excluidoEm: null },
  });

  if (!anexo) {
    return NextResponse.json({ erro: "Anexo não encontrado." }, { status: 404 });
  }

  // Usa anexo.id/anexo.pocoId (vindos do registro já validado no banco),
  // nunca os parâmetros crus da URL, pra montar o caminho em disco — o
  // registro só existe com esses valores porque nós mesmos os geramos
  // (randomUUID) no momento do upload, nunca a partir de entrada do
  // usuário na requisição de leitura.
  let extensao: string;
  try {
    extensao = obterExtensaoValidada(anexo.nomeArquivo);
  } catch {
    return NextResponse.json({ erro: "Arquivo inválido." }, { status: 500 });
  }

  const caminho = caminhoArquivoAnexo(anexo.pocoId, anexo.id, extensao);

  let conteudo: Buffer;
  try {
    conteudo = await readFile(caminho);
  } catch {
    return NextResponse.json(
      { erro: "Arquivo não encontrado no armazenamento." },
      { status: 404 }
    );
  }

  return new NextResponse(new Uint8Array(conteudo), {
    headers: {
      "Content-Type": extensoesAceitas[extensao] ?? "application/octet-stream",
      "Content-Disposition": `inline; filename="${nomeArquivoParaDownload(anexo.nomeArquivo)}"`,
    },
  });
}
