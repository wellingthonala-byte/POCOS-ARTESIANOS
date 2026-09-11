import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gerarRelatorioPdf } from "@/lib/relatorio/pdf";
import { nomeArquivoRelatorio } from "@/lib/relatorio/nome-arquivo";

export async function GET(
  _requisicao: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const poco = await prisma.poco.findFirst({
    where: { id, excluidoEm: null },
    select: { identificacao: true },
  });

  if (!poco) {
    return NextResponse.json({ erro: "Poço não encontrado." }, { status: 404 });
  }

  const pdf = await gerarRelatorioPdf(id);
  if (!pdf) {
    return NextResponse.json({ erro: "Poço não encontrado." }, { status: 404 });
  }

  const nomeArquivo = nomeArquivoRelatorio(poco.identificacao, "pdf");

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
    },
  });
}
