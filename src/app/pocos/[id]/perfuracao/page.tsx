import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FormularioPerfuracao } from "@/components/pocos/formulario-perfuracao";
import { NavegacaoEtapas } from "@/components/pocos/navegacao-etapas";

export const dynamic = "force-dynamic";

export default async function EtapaPerfuracao({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [poco, responsaveisTecnicos] = await Promise.all([
    prisma.poco.findFirst({ where: { id, excluidoEm: null } }),
    prisma.usuario.findMany({
      where: { papel: "responsavel_tecnico", excluidoEm: null, ativo: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  if (!poco) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl p-4 pb-24">
      <h1 className="mb-1 text-2xl font-bold">Poço {poco.identificacao}</h1>
      <NavegacaoEtapas pocoId={poco.id} etapaAtual="perfuracao" />
      <FormularioPerfuracao
        pocoId={poco.id}
        atualizadoEmInicial={poco.atualizadoEm.toISOString()}
        valoresIniciais={{
          metodoPerfuracao: poco.metodoPerfuracao ?? "",
          dataInicioPerfuracao: poco.dataInicioPerfuracao
            ? poco.dataInicioPerfuracao.toISOString().slice(0, 10)
            : "",
          dataFimPerfuracao: poco.dataFimPerfuracao
            ? poco.dataFimPerfuracao.toISOString().slice(0, 10)
            : "",
          profundidadeFinal: poco.profundidadeFinal
            ? poco.profundidadeFinal.toString()
            : "",
          numeroArt: poco.numeroArt ?? "",
          responsavelTecnicoId: poco.responsavelTecnicoId ?? "",
        }}
        responsaveisTecnicos={responsaveisTecnicos.map((usuario) => ({
          id: usuario.id,
          nome: usuario.nome,
          crea: usuario.crea,
        }))}
        proximaEtapaUrl={`/pocos/${poco.id}/litologia`}
      />
    </main>
  );
}
