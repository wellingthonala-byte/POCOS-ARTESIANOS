import { prisma } from "@/lib/prisma";
import { FormularioObra } from "@/components/obras/formulario-obra";
import { criarObra } from "@/app/obras/acoes";

export const dynamic = "force-dynamic";

export default async function NovaObra() {
  const clientes = await prisma.cliente.findMany({
    where: { excluidoEm: null },
    orderBy: { nome: "asc" },
  });

  return (
    <main className="mx-auto max-w-2xl p-4 pb-24 md:max-w-4xl md:p-8">
      <h1 className="mb-6 text-2xl font-bold">Nova obra</h1>
      <FormularioObra
        clientes={clientes.map((cliente) => ({
          id: cliente.id,
          nome: cliente.nome,
        }))}
        acao={criarObra}
      />
    </main>
  );
}
