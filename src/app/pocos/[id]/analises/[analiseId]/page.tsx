import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NavegacaoEtapas } from "@/components/pocos/navegacao-etapas";
import { FormularioAnalise } from "@/components/pocos/formulario-analise";
import { ListaParametros } from "@/components/pocos/lista-parametros";

export const dynamic = "force-dynamic";

export default async function DetalheDaAnalise({
  params,
}: {
  params: Promise<{ id: string; analiseId: string }>;
}) {
  const { id, analiseId } = await params;

  const poco = await prisma.poco.findFirst({ where: { id, excluidoEm: null } });
  if (!poco) {
    notFound();
  }

  const analise = await prisma.analiseAgua.findFirst({
    where: { id: analiseId, pocoId: id, excluidoEm: null },
    include: {
      parametros: {
        where: { excluidoEm: null },
        orderBy: { criadoEm: "asc" },
      },
    },
  });
  if (!analise) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl p-4 pb-24">
      <h1 className="mb-1 font-mono text-2xl font-bold text-gray-900">Poço {poco.identificacao}</h1>
      <NavegacaoEtapas pocoId={poco.id} etapaAtual="" />
      <h2 className="mb-4 text-lg font-semibold">Análise de água</h2>

      <div className="mb-6">
        <FormularioAnalise
          pocoId={poco.id}
          analiseId={analise.id}
          dataColetaInicial={analise.dataColeta.toISOString().slice(0, 10)}
          laboratorioInicial={analise.laboratorio ?? ""}
        />
      </div>

      <ListaParametros
        pocoId={poco.id}
        analiseId={analise.id}
        parametros={analise.parametros.map((parametro) => ({
          id: parametro.id,
          nome: parametro.nome,
          valor: parametro.valor.toNumber(),
          unidade: parametro.unidade,
          vmpMinimo: parametro.vmpMinimo ? parametro.vmpMinimo.toNumber() : null,
          vmpMaximo: parametro.vmpMaximo ? parametro.vmpMaximo.toNumber() : null,
        }))}
      />
    </main>
  );
}
