import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NavegacaoEtapas } from "@/components/pocos/navegacao-etapas";
import { PerfilPoco } from "@/components/pocos/perfil-poco";
import { mapearDadosParaPerfil, temDadosDePerfil } from "@/lib/perfil/mapear-dados";
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

  const { camadas, construtivo, profundidadeTotal } = mapearDadosParaPerfil(poco);
  const temPerfil = temDadosDePerfil({ camadas, construtivo, profundidadeTotal });

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
