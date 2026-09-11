import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const rotulosTipoPessoa: Record<string, string> = {
  fisica: "Pessoa física",
  juridica: "Pessoa jurídica",
};

export default async function ListaDeClientes() {
  const clientes = await prisma.cliente.findMany({
    where: { excluidoEm: null },
    orderBy: { nome: "asc" },
  });

  return (
    <main className="mx-auto max-w-2xl p-4 pb-24">
      <h1 className="mb-4 text-2xl font-bold">Clientes</h1>

      {clientes.length === 0 ? (
        <p className="mt-8 text-center text-gray-500">
          Nenhum cliente cadastrado ainda. Toque em “+” para criar o
          primeiro.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {clientes.map((cliente) => (
            <li key={cliente.id}>
              <Link
                href={`/clientes/${cliente.id}/editar`}
                className="block rounded-lg border border-gray-200 p-4 active:bg-gray-50"
              >
                <span className="text-lg font-semibold">{cliente.nome}</span>
                <p className="text-sm text-gray-500">
                  {rotulosTipoPessoa[cliente.tipoPessoa]} — {cliente.documento}
                </p>
                {cliente.municipio && (
                  <p className="text-sm text-gray-500">
                    {cliente.municipio}/{cliente.uf}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/clientes/novo"
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-3xl text-white shadow-lg active:bg-blue-700"
        aria-label="Novo cliente"
      >
        +
      </Link>
    </main>
  );
}
