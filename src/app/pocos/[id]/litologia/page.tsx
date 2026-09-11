import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FormularioLitologia } from "@/components/pocos/formulario-litologia";
import { NavegacaoEtapas } from "@/components/pocos/navegacao-etapas";

export const dynamic = "force-dynamic";

export default async function EtapaLitologia({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [poco, camadas] = await Promise.all([
    prisma.poco.findFirst({ where: { id, excluidoEm: null } }),
    prisma.camadaLitologica.findMany({
      where: { pocoId: id, excluidoEm: null },
      orderBy: { ordem: "asc" },
    }),
  ]);

  if (!poco) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl p-4 pb-24">
      <h1 className="mb-1 text-2xl font-bold">Poço {poco.identificacao}</h1>
      <NavegacaoEtapas pocoId={poco.id} etapaAtual="litologia" />
      <FormularioLitologia
        pocoId={poco.id}
        camadas={camadas.map((camada) => ({
          id: camada.id,
          profundidadeInicial: camada.profundidadeInicial.toFixed(2),
          profundidadeFinal: camada.profundidadeFinal.toFixed(2),
          descricao: camada.descricao,
        }))}
        proximaEtapaUrl={`/pocos/${poco.id}/construtivo`}
      />
    </main>
  );
}
