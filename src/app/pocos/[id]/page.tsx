import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NavegacaoEtapas } from "@/components/pocos/navegacao-etapas";
import { PerfilPoco } from "@/components/pocos/perfil-poco";
import { mapearDadosParaPerfil, temDadosDePerfil } from "@/lib/perfil/mapear-dados";
import { EspelharPocoOffline } from "@/components/pwa/espelhar-poco-offline";
import { FormularioExcluirPoco } from "@/components/pocos/formulario-excluir-poco";
import { rotulosStatusPoco, coresStatusPoco } from "@/lib/rotulos";
import { Cartao } from "@/components/ui/cartao";
import { LinhaMenu } from "@/components/ui/linha-menu";

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
      <EspelharPocoOffline
        dados={{
          id: poco.id,
          identificacao: poco.identificacao,
          status: poco.status,
          obraNome: poco.obra.nome,
          clienteNome: poco.obra.cliente.nome,
          municipio: poco.municipio,
          uf: poco.uf,
          profundidadeFinalTexto: poco.profundidadeFinal
            ? poco.profundidadeFinal.toString()
            : null,
          camadas,
          construtivo,
          profundidadeTotal,
        }}
      />
      <div className="mb-1 flex items-center justify-between gap-2">
        <h1 className="font-mono text-2xl font-bold text-gray-900">
          Poço {poco.identificacao}
        </h1>
        <span
          className={`rounded-sm px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${coresStatusPoco[poco.status]}`}
        >
          {rotulosStatusPoco[poco.status]}
        </span>
      </div>
      <p className="mb-6 text-gray-500">
        {poco.obra.nome} — {poco.obra.cliente.nome}
      </p>

      <NavegacaoEtapas pocoId={poco.id} etapaAtual="" />

      {temPerfil && (
        <Cartao titulo="Perfil do poço">
          <PerfilPoco
            camadas={camadas}
            construtivo={construtivo}
            profundidadeTotal={profundidadeTotal}
          />
        </Cartao>
      )}

      <Cartao titulo="Registros do poço">
        <LinhaMenu
          href={`/pocos/${poco.id}/teste-vazao`}
          rotulo="Teste de vazão"
          descricao="Leituras, cronômetro e gráficos"
        />
        <LinhaMenu
          href={`/pocos/${poco.id}/analises`}
          rotulo="Análises de água"
          descricao="Parâmetros físico-químicos e VMP"
        />
        <LinhaMenu
          href={`/pocos/${poco.id}/anexos`}
          rotulo="Anexos"
          descricao="Fotos, ART, croqui e laudos"
        />
      </Cartao>

      <Cartao titulo="Relatório">
        <div className="flex flex-col gap-3">
          <a
            href={`/pocos/${poco.id}/relatorio/pdf`}
            className="flex min-h-11 items-center justify-center rounded-sm bg-orange-500 px-4 text-base font-semibold text-white active:bg-orange-600"
          >
            Baixar relatório em PDF
          </a>
          <a
            href={`/pocos/${poco.id}/relatorio/excel`}
            className="flex min-h-11 items-center justify-center rounded-sm bg-gray-100 px-4 text-base font-semibold text-gray-700 active:bg-gray-200"
          >
            Baixar planilha Excel
          </a>
        </div>
      </Cartao>

      <FormularioExcluirPoco pocoId={poco.id} />
    </main>
  );
}
