import { prisma } from "@/lib/prisma";
import { rotulosTipoPessoa } from "@/lib/rotulos";
import { CartaoLista } from "@/components/ui/cartao-lista";
import { BotaoNovoFlutuante } from "@/components/ui/botao-novo-flutuante";

export const dynamic = "force-dynamic";

export default async function ListaDeClientes() {
  const clientes = await prisma.cliente.findMany({
    where: { excluidoEm: null },
    orderBy: { nome: "asc" },
  });

  return (
    <main className="mx-auto max-w-2xl p-4 pb-24">
      <h1 className="mb-4 text-2xl font-bold text-gray-900">Clientes</h1>

      {clientes.length === 0 ? (
        <p className="mt-8 text-center text-gray-500">
          Nenhum cliente cadastrado ainda. Toque em &ldquo;+&rdquo; para criar o
          primeiro.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
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
      )}

      <BotaoNovoFlutuante href="/clientes/novo" rotulo="Novo cliente" />
    </main>
  );
}
