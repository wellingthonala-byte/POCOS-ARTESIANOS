import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NavegacaoEtapas } from "@/components/pocos/navegacao-etapas";
import { FormularioAnexo } from "@/components/pocos/formulario-anexo";
import { ListaAnexos } from "@/components/pocos/lista-anexos";

export const dynamic = "force-dynamic";

export default async function AnexosDoPoco({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const poco = await prisma.poco.findFirst({ where: { id, excluidoEm: null } });
  if (!poco) {
    notFound();
  }

  const anexos = await prisma.anexo.findMany({
    where: { pocoId: id, excluidoEm: null },
    orderBy: { criadoEm: "desc" },
  });

  return (
    <main className="mx-auto max-w-2xl p-4 pb-24">
      <h1 className="mb-1 text-2xl font-bold">Poço {poco.identificacao}</h1>
      <NavegacaoEtapas pocoId={poco.id} etapaAtual="" />
      <h2 className="mb-4 text-lg font-semibold">Anexos</h2>

      <div className="mb-6">
        <ListaAnexos
          pocoId={poco.id}
          anexos={anexos.map((anexo) => ({
            id: anexo.id,
            tipo: anexo.tipo,
            arquivoUrl: anexo.arquivoUrl,
            nomeArquivo: anexo.nomeArquivo,
            legenda: anexo.legenda,
            incluirNoRelatorio: anexo.incluirNoRelatorio,
          }))}
        />
      </div>

      <FormularioAnexo pocoId={poco.id} />
    </main>
  );
}
