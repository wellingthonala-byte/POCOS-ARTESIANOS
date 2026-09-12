import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FormularioIdentificacaoLocacao } from "@/components/pocos/formulario-identificacao-locacao";
import { NavegacaoEtapas } from "@/components/pocos/navegacao-etapas";
import { atualizarIdentificacaoLocacao } from "@/app/pocos/acoes";

export const dynamic = "force-dynamic";

export default async function EtapaIdentificacao({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [poco, obras] = await Promise.all([
    prisma.poco.findFirst({ where: { id, excluidoEm: null } }),
    prisma.obra.findMany({
      where: { excluidoEm: null },
      include: { cliente: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  if (!poco) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl p-4 pb-24">
      <h1 className="mb-1 font-mono text-2xl font-bold text-gray-900">Poço {poco.identificacao}</h1>
      <NavegacaoEtapas pocoId={poco.id} etapaAtual="identificacao" />
      <FormularioIdentificacaoLocacao
        obras={obras.map((obra) => ({
          id: obra.id,
          rotulo: `${obra.nome} — ${obra.cliente.nome}`,
        }))}
        valoresIniciais={{
          id: poco.id,
          identificacao: poco.identificacao,
          obraId: poco.obraId,
          status: poco.status,
          municipio: poco.municipio ?? "",
          uf: poco.uf ?? "",
          latitude: poco.latitude.toString(),
          longitude: poco.longitude.toString(),
          metodoObtencaoCoordenada: poco.metodoObtencaoCoordenada,
          atualizadoEm: poco.atualizadoEm.toISOString(),
        }}
        acao={atualizarIdentificacaoLocacao.bind(null, poco.id)}
      />
    </main>
  );
}
