import { prisma } from "@/lib/prisma";
import { CartaoLista } from "@/components/ui/cartao-lista";
import { BotaoNovoFlutuante } from "@/components/ui/botao-novo-flutuante";

export const dynamic = "force-dynamic";

export default async function ListaDeObras() {
  const obras = await prisma.obra.findMany({
    where: { excluidoEm: null },
    include: { cliente: true },
    orderBy: { nome: "asc" },
  });

  return (
    <main className="mx-auto max-w-2xl p-4 pb-24">
      <h1 className="mb-4 text-2xl font-bold text-gray-900">Obras</h1>

      {obras.length === 0 ? (
        <p className="mt-8 text-center text-gray-500">
          Nenhuma obra cadastrada ainda. Toque em &ldquo;+&rdquo; para criar a primeira.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {obras.map((obra) => (
            <li key={obra.id}>
              <CartaoLista href={`/obras/${obra.id}/editar`}>
                <span className="text-lg font-semibold text-gray-900">{obra.nome}</span>
                <p className="text-sm text-gray-500">{obra.cliente.nome}</p>
                <p className="text-sm text-gray-500">
                  {obra.municipio}/{obra.uf}
                </p>
              </CartaoLista>
            </li>
          ))}
        </ul>
      )}

      <BotaoNovoFlutuante href="/obras/novo" rotulo="Nova obra" />
    </main>
  );
}
