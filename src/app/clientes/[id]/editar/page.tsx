import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FormularioCliente } from "@/components/clientes/formulario-cliente";
import { atualizarCliente } from "@/app/clientes/acoes";

export const dynamic = "force-dynamic";

export default async function EditarCliente({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const cliente = await prisma.cliente.findFirst({
    where: { id, excluidoEm: null },
  });

  if (!cliente) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl p-4 pb-24">
      <h1 className="mb-6 text-2xl font-bold">Editar cliente</h1>
      <FormularioCliente
        valoresIniciais={{
          id: cliente.id,
          nome: cliente.nome,
          tipoPessoa: cliente.tipoPessoa,
          documento: cliente.documento,
          telefone: cliente.telefone ?? "",
          email: cliente.email ?? "",
          endereco: cliente.endereco ?? "",
          municipio: cliente.municipio ?? "",
          uf: cliente.uf ?? "",
        }}
        acao={atualizarCliente.bind(null, cliente.id)}
      />
    </main>
  );
}
