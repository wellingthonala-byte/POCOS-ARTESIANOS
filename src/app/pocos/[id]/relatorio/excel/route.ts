import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gerarRelatorioExcel } from "@/lib/relatorio/excel";
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

  const excel = await gerarRelatorioExcel(id);
  if (!excel) {
    return NextResponse.json({ erro: "Poço não encontrado." }, { status: 404 });
  }

  const nomeArquivo = nomeArquivoRelatorio(poco.identificacao, "xlsx");

  return new NextResponse(new Uint8Array(excel), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
    },
  });
}
