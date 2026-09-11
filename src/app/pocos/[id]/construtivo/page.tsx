import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FormularioConstrutivo } from "@/components/pocos/formulario-construtivo";
import { NavegacaoEtapas } from "@/components/pocos/navegacao-etapas";

export const dynamic = "force-dynamic";

export default async function EtapaConstrutivo({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [poco, revestimentos, cimentacoes, preFiltros] = await Promise.all([
    prisma.poco.findFirst({ where: { id, excluidoEm: null } }),
    prisma.revestimento.findMany({
      where: { pocoId: id, excluidoEm: null },
      orderBy: { ordem: "asc" },
    }),
    prisma.cimentacao.findMany({
      where: { pocoId: id, excluidoEm: null },
      orderBy: { ordem: "asc" },
    }),
    prisma.preFiltro.findMany({
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
      <NavegacaoEtapas pocoId={poco.id} etapaAtual="construtivo" />
      <FormularioConstrutivo
        pocoId={poco.id}
        revestimentos={revestimentos.map((trecho) => ({
          id: trecho.id,
          profundidadeInicial: trecho.profundidadeInicial.toFixed(2),
          profundidadeFinal: trecho.profundidadeFinal.toFixed(2),
          tipo: trecho.tipo,
          material: trecho.material,
          diametro: trecho.diametro,
        }))}
        cimentacoes={cimentacoes.map((trecho) => ({
          id: trecho.id,
          profundidadeInicial: trecho.profundidadeInicial.toFixed(2),
          profundidadeFinal: trecho.profundidadeFinal.toFixed(2),
          detalhe: null,
        }))}
        preFiltros={preFiltros.map((trecho) => ({
          id: trecho.id,
          profundidadeInicial: trecho.profundidadeInicial.toFixed(2),
          profundidadeFinal: trecho.profundidadeFinal.toFixed(2),
          detalhe: trecho.granulometria,
        }))}
        proximaEtapaUrl="/pocos"
      />
    </main>
  );
}
