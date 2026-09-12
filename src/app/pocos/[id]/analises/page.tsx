import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NavegacaoEtapas } from "@/components/pocos/navegacao-etapas";
import { FormularioNovaAnalise } from "@/components/pocos/formulario-nova-analise";
import { CartaoLista } from "@/components/ui/cartao-lista";

export const dynamic = "force-dynamic";

type ParametroResumo = {
  valor: { toNumber(): number };
  vmpMinimo: { toNumber(): number } | null;
  vmpMaximo: { toNumber(): number } | null;
};

function algumForaDoPadrao(parametros: ParametroResumo[]): boolean {
  return parametros.some((parametro) => {
    const valor = parametro.valor.toNumber();
    if (parametro.vmpMinimo && valor < parametro.vmpMinimo.toNumber()) return true;
    if (parametro.vmpMaximo && valor > parametro.vmpMaximo.toNumber()) return true;
    return false;
  });
}

export default async function ListaDeAnalises({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const poco = await prisma.poco.findFirst({ where: { id, excluidoEm: null } });
  if (!poco) {
    notFound();
  }

  const analises = await prisma.analiseAgua.findMany({
    where: { pocoId: id, excluidoEm: null },
    include: { parametros: { where: { excluidoEm: null } } },
    orderBy: { dataColeta: "desc" },
  });

  return (
    <main className="mx-auto max-w-2xl p-4 pb-24 md:max-w-4xl md:p-8">
      <h1 className="mb-1 font-mono text-2xl font-bold text-gray-900">
        Poço {poco.identificacao}
      </h1>
      <NavegacaoEtapas pocoId={poco.id} etapaAtual="" />
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Análises de água</h2>

      {analises.length === 0 ? (
        <p className="mb-6 text-gray-500">Nenhuma análise lançada ainda.</p>
      ) : (
        <ul className="mb-6 flex flex-col gap-3">
          {analises.map((analise) => (
            <li key={analise.id}>
              <CartaoLista href={`/pocos/${poco.id}/analises/${analise.id}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-lg font-semibold text-gray-900">
                    {new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
                      analise.dataColeta
                    )}
                  </span>
                  {algumForaDoPadrao(analise.parametros) && (
                    <span className="rounded-sm bg-red-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-red-800">
                      Fora do padrão
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {analise.laboratorio ?? "Laboratório não informado"} —{" "}
                  {analise.parametros.length} parâmetro(s)
                </p>
              </CartaoLista>
            </li>
          ))}
        </ul>
      )}

      <FormularioNovaAnalise pocoId={poco.id} />
    </main>
  );
}
