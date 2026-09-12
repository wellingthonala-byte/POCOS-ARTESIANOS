import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CartaoLista } from "@/components/ui/cartao-lista";
import { BotaoNovoFlutuante } from "@/components/ui/botao-novo-flutuante";
import { LinhaTabela } from "@/components/ui/linha-tabela";

export const dynamic = "force-dynamic";

export default async function ListaDeObras() {
  const obras = await prisma.obra.findMany({
    where: { excluidoEm: null },
    include: { cliente: true },
    orderBy: { nome: "asc" },
  });

  return (
    <main className="mx-auto max-w-2xl p-4 pb-24 md:max-w-4xl md:p-8">
      <h1 className="mb-4 text-2xl font-bold text-gray-900">Obras</h1>

      {obras.length === 0 ? (
        <p className="mt-8 text-center text-gray-500">
          Nenhuma obra cadastrada ainda. Toque em &ldquo;+&rdquo; para criar a primeira.
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-3 md:hidden">
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

          <div className="hidden overflow-x-auto rounded-sm border border-gray-200 md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Nome
                  </th>
                  <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Cliente
                  </th>
                  <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Local
                  </th>
                </tr>
              </thead>
              <tbody>
                {obras.map((obra) => (
                  <LinhaTabela key={obra.id} href={`/obras/${obra.id}/editar`}>
                    <td className="p-3 font-semibold text-gray-900">
                      <Link href={`/obras/${obra.id}/editar`} className="hover:underline">
                        {obra.nome}
                      </Link>
                    </td>
                    <td className="p-3 text-gray-700">{obra.cliente.nome}</td>
                    <td className="p-3 text-gray-500">
                      {obra.municipio}/{obra.uf}
                    </td>
                  </LinhaTabela>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <BotaoNovoFlutuante href="/obras/novo" rotulo="Nova obra" />
    </main>
  );
}
