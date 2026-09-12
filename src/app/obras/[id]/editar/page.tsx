import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FormularioObra } from "@/components/obras/formulario-obra";
import { atualizarObra } from "@/app/obras/acoes";

export const dynamic = "force-dynamic";

export default async function EditarObra({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [obra, clientes] = await Promise.all([
    prisma.obra.findFirst({ where: { id, excluidoEm: null } }),
    prisma.cliente.findMany({
      where: { excluidoEm: null },
      orderBy: { nome: "asc" },
    }),
  ]);

  if (!obra) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl p-4 pb-24 md:max-w-4xl md:p-8">
      <h1 className="mb-6 text-2xl font-bold">Editar obra</h1>
      <FormularioObra
        clientes={clientes.map((cliente) => ({
          id: cliente.id,
          nome: cliente.nome,
        }))}
        valoresIniciais={{
          id: obra.id,
          clienteId: obra.clienteId,
          nome: obra.nome,
          endereco: obra.endereco ?? "",
          municipio: obra.municipio,
          uf: obra.uf,
        }}
        acao={atualizarObra.bind(null, obra.id)}
      />
    </main>
  );
}
