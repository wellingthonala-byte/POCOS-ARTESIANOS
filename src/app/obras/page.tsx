import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ListaDeObras() {
  const obras = await prisma.obra.findMany({
    where: { excluidoEm: null },
    include: { cliente: true },
    orderBy: { nome: "asc" },
  });

  return (
    <main className="mx-auto max-w-2xl p-4 pb-24">
      <h1 className="mb-4 text-2xl font-bold">Obras</h1>

      {obras.length === 0 ? (
        <p className="mt-8 text-center text-gray-500">
          Nenhuma obra cadastrada ainda. Toque em “+” para criar a primeira.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {obras.map((obra) => (
            <li key={obra.id}>
              <Link
                href={`/obras/${obra.id}/editar`}
                className="block rounded-lg border border-gray-200 p-4 active:bg-gray-50"
              >
                <span className="text-lg font-semibold">{obra.nome}</span>
                <p className="text-sm text-gray-500">{obra.cliente.nome}</p>
                <p className="text-sm text-gray-500">
                  {obra.municipio}/{obra.uf}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/obras/novo"
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-3xl text-white shadow-lg active:bg-blue-700"
        aria-label="Nova obra"
      >
        +
      </Link>
    </main>
  );
}
