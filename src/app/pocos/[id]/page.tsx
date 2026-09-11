import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NavegacaoEtapas } from "@/components/pocos/navegacao-etapas";
import { PerfilPoco } from "@/components/pocos/perfil-poco";
import { rotulosStatusPoco, coresStatusPoco } from "@/lib/rotulos";

export const dynamic = "force-dynamic";

export default async function DetalheDoPoco({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const poco = await prisma.poco.findFirst({
    where: { id, excluidoEm: null },
    include: {
      obra: { include: { cliente: true } },
      camadasLitologicas: {
        where: { excluidoEm: null },
        orderBy: { ordem: "asc" },
      },
      revestimentos: {
        where: { excluidoEm: null },
        orderBy: { ordem: "asc" },
      },
      cimentacoes: {
        where: { excluidoEm: null },
        orderBy: { ordem: "asc" },
      },
      preFiltros: {
        where: { excluidoEm: null },
        orderBy: { ordem: "asc" },
      },
      testesVazao: {
        where: { excluidoEm: null },
        orderBy: { criadoEm: "asc" },
        take: 1,
      },
    },
  });

  if (!poco) {
    notFound();
  }

  const camadas = poco.camadasLitologicas.map((camada) => ({
    id: camada.id,
    ordem: camada.ordem,
    profundidadeInicial: camada.profundidadeInicial.toNumber(),
    profundidadeFinal: camada.profundidadeFinal.toNumber(),
    descricao: camada.descricao,
  }));

  const profundidadeTotal =
    poco.profundidadeFinal?.toNumber() ??
    (camadas.length > 0 ? camadas[camadas.length - 1].profundidadeFinal : 0);

  const construtivo = {
    revestimentos: poco.revestimentos.map((r) => ({
      id: r.id,
      profundidadeInicial: r.profundidadeInicial.toNumber(),
      profundidadeFinal: r.profundidadeFinal.toNumber(),
      tipo: r.tipo,
      diametro: r.diametro,
    })),
    cimentacoes: poco.cimentacoes.map((c) => ({
      id: c.id,
      profundidadeInicial: c.profundidadeInicial.toNumber(),
      profundidadeFinal: c.profundidadeFinal.toNumber(),
    })),
    preFiltros: poco.preFiltros.map((p) => ({
      id: p.id,
      profundidadeInicial: p.profundidadeInicial.toNumber(),
      profundidadeFinal: p.profundidadeFinal.toNumber(),
    })),
    nivelEstatico: poco.testesVazao[0]?.nivelEstatico?.toNumber() ?? null,
    nivelDinamico: poco.testesVazao[0]?.nivelDinamicoEstabilizado?.toNumber() ?? null,
  };

  const temPerfil =
    camadas.length > 0 ||
    construtivo.revestimentos.length > 0 ||
    construtivo.cimentacoes.length > 0 ||
    construtivo.preFiltros.length > 0;

  return (
    <main className="mx-auto max-w-2xl p-4 pb-24">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Poço {poco.identificacao}</h1>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${coresStatusPoco[poco.status]}`}
        >
          {rotulosStatusPoco[poco.status]}
        </span>
      </div>
      <p className="mb-6 text-gray-500">
        {poco.obra.nome} — {poco.obra.cliente.nome}
      </p>

      <NavegacaoEtapas pocoId={poco.id} etapaAtual="" />

      {temPerfil && (
        <div className="mt-6">
          <h2 className="mb-2 font-medium">Perfil do poço</h2>
          <PerfilPoco
            camadas={camadas}
            construtivo={construtivo}
            profundidadeTotal={profundidadeTotal}
          />
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 rounded-lg border border-gray-200 p-4">
        <h2 className="font-medium">Relatório</h2>
        <a
          href={`/pocos/${poco.id}/relatorio/pdf`}
          className="flex min-h-11 items-center justify-center rounded-md bg-blue-600 px-4 text-base font-semibold text-white active:bg-blue-700"
        >
          Baixar relatório em PDF
        </a>
        <a
          href={`/pocos/${poco.id}/relatorio/excel`}
          className="flex min-h-11 items-center justify-center rounded-md bg-gray-100 px-4 text-base font-semibold text-gray-700 active:bg-gray-200"
        >
          Baixar planilha Excel
        </a>
      </div>
    </main>
  );
}
