import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { rotulosTipoPessoa } from "@/lib/rotulos";
import { CartaoLista } from "@/components/ui/cartao-lista";
import { BotaoNovoFlutuante } from "@/components/ui/botao-novo-flutuante";
import { LinhaTabela } from "@/components/ui/linha-tabela";

export const dynamic = "force-dynamic";

export default async function ListaDeClientes() {
  const clientes = await prisma.cliente.findMany({
    where: { excluidoEm: null },
    orderBy: { nome: "asc" },
  });

  return (
    <main className="mx-auto max-w-2xl p-4 pb-24 md:max-w-4xl md:p-8">
      <h1 className="mb-4 text-2xl font-bold text-gray-900">Clientes</h1>

      {clientes.length === 0 ? (
        <p className="mt-8 text-center text-gray-500">
          Nenhum cliente cadastrado ainda. Toque em &ldquo;+&rdquo; para criar o
          primeiro.
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-3 md:hidden">
            {clientes.map((cliente) => (
              <li key={cliente.id}>
                <CartaoLista href={`/clientes/${cliente.id}/editar`}>
                  <span className="text-lg font-semibold text-gray-900">{cliente.nome}</span>
                  <p className="text-sm text-gray-500">
                    {rotulosTipoPessoa[cliente.tipoPessoa]} — {cliente.documento}
                  </p>
                  {cliente.municipio && (
                    <p className="text-sm text-gray-500">
                      {cliente.municipio}/{cliente.uf}
                    </p>
                  )}
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
                    Tipo
                  </th>
                  <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    CPF/CNPJ
                  </th>
                  <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Local
                  </th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente) => (
                  <LinhaTabela key={cliente.id} href={`/clientes/${cliente.id}/editar`}>
                    <td className="p-3 font-semibold text-gray-900">
                      <Link href={`/clientes/${cliente.id}/editar`} className="hover:underline">
                        {cliente.nome}
                      </Link>
                    </td>
                    <td className="p-3 text-gray-700">{rotulosTipoPessoa[cliente.tipoPessoa]}</td>
                    <td className="p-3 font-mono text-gray-500">{cliente.documento}</td>
                    <td className="p-3 text-gray-500">
                      {cliente.municipio ? `${cliente.municipio}/${cliente.uf}` : "—"}
                    </td>
                  </LinhaTabela>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <BotaoNovoFlutuante href="/clientes/novo" rotulo="Novo cliente" />
    </main>
  );
}
