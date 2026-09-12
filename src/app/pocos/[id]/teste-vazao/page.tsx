import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NavegacaoEtapas } from "@/components/pocos/navegacao-etapas";
import { TesteVazaoCompleto } from "@/components/pocos/teste-vazao-completo";

export const dynamic = "force-dynamic";

export default async function TesteVazaoCompletoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const poco = await prisma.poco.findFirst({ where: { id, excluidoEm: null } });
  if (!poco) {
    notFound();
  }

  const teste = await prisma.testeVazao.findFirst({
    where: { pocoId: id, excluidoEm: null },
    orderBy: { criadoEm: "asc" },
    include: {
      leituras: {
        where: { excluidoEm: null },
        orderBy: { tempoMinutos: "asc" },
      },
    },
  });

  return (
    <main className="mx-auto max-w-2xl p-4 pb-24">
      <h1 className="mb-1 font-mono text-2xl font-bold text-gray-900">Poço {poco.identificacao}</h1>
      <NavegacaoEtapas pocoId={poco.id} etapaAtual="" />
      <h2 className="mb-4 text-lg font-semibold">Teste de vazão completo</h2>

      {!teste ? (
        <p className="text-gray-500">
          Lance ao menos o nível estático na etapa{" "}
          <Link href={`/pocos/${poco.id}/niveis-vazao`} className="text-blue-600 underline">
            Níveis e vazão
          </Link>{" "}
          antes de configurar o teste completo.
        </p>
      ) : (
        <TesteVazaoCompleto
          pocoId={poco.id}
          tipoInicial={teste.tipo}
          dataHoraInicioInicial={teste.dataHoraInicio.toISOString().slice(0, 16)}
          nivelEstatico={teste.nivelEstatico.toNumber()}
          leituras={teste.leituras.map((leitura) => ({
            id: leitura.id,
            tempoMinutos: leitura.tempoMinutos.toNumber(),
            nivelDinamico: leitura.nivelDinamico.toNumber(),
            vazao: leitura.vazao ? leitura.vazao.toNumber() : null,
          }))}
        />
      )}
    </main>
  );
}
