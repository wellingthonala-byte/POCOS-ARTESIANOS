import { prisma } from "@/lib/prisma";
import { FormularioIdentificacaoLocacao } from "@/components/pocos/formulario-identificacao-locacao";
import { criarPoco } from "@/app/pocos/acoes";

export const dynamic = "force-dynamic";

export default async function NovoPoco() {
  const obras = await prisma.obra.findMany({
    where: { excluidoEm: null },
    include: { cliente: true },
    orderBy: { nome: "asc" },
  });

  return (
    <main className="mx-auto max-w-2xl p-4 pb-24">
      <h1 className="mb-1 text-2xl font-bold">Novo poço</h1>
      <p className="mb-6 text-gray-500">
        Etapa 1 de 5 — Identificação e locação
      </p>
      <FormularioIdentificacaoLocacao
        obras={obras.map((obra) => ({
          id: obra.id,
          rotulo: `${obra.nome} — ${obra.cliente.nome}`,
        }))}
        acao={criarPoco}
      />
    </main>
  );
}
