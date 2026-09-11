import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FormularioNiveisVazao } from "@/components/pocos/formulario-niveis-vazao";
import { NavegacaoEtapas } from "@/components/pocos/navegacao-etapas";

export const dynamic = "force-dynamic";

export default async function EtapaNiveisVazao({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [poco, testeVazao] = await Promise.all([
    prisma.poco.findFirst({ where: { id, excluidoEm: null } }),
    prisma.testeVazao.findFirst({
      where: { pocoId: id, excluidoEm: null },
      orderBy: { criadoEm: "asc" },
    }),
  ]);

  if (!poco) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl p-4 pb-24">
      <h1 className="mb-1 text-2xl font-bold">Poço {poco.identificacao}</h1>
      <NavegacaoEtapas pocoId={poco.id} etapaAtual="niveis-vazao" />
      <FormularioNiveisVazao
        pocoId={poco.id}
        atualizadoEmInicial={testeVazao ? testeVazao.atualizadoEm.toISOString() : null}
        valoresIniciais={{
          nivelEstatico: testeVazao ? testeVazao.nivelEstatico.toString() : "",
          nivelDinamicoEstabilizado: testeVazao?.nivelDinamicoEstabilizado
            ? testeVazao.nivelDinamicoEstabilizado.toString()
            : "",
          vazaoEstabilizada: testeVazao?.vazaoEstabilizada
            ? testeVazao.vazaoEstabilizada.toString()
            : "",
        }}
        proximaEtapaUrl="/pocos"
      />
    </main>
  );
}
