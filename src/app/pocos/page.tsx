import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { rotulosStatusPoco, coresStatusPoco } from "@/lib/rotulos";
import { EspelharListaPocosOffline } from "@/components/pwa/espelhar-lista-pocos-offline";

export const dynamic = "force-dynamic";

export default async function ListaDePocos() {
  const pocos = await prisma.poco.findMany({
    where: { excluidoEm: null },
    include: { obra: { include: { cliente: true } } },
    orderBy: { criadoEm: "desc" },
  });

  return (
    <main className="mx-auto max-w-2xl p-4 pb-24">
      <EspelharListaPocosOffline
        pocos={pocos.map((poco) => ({
          id: poco.id,
          identificacao: poco.identificacao,
          status: poco.status,
          obraNome: poco.obra.nome,
          clienteNome: poco.obra.cliente.nome,
          municipio: poco.municipio,
          uf: poco.uf,
          profundidadeFinalTexto: poco.profundidadeFinal
            ? poco.profundidadeFinal.toString()
            : null,
        }))}
      />
      <h1 className="mb-4 text-2xl font-bold">Poços</h1>

      {pocos.length === 0 ? (
        <p className="mt-8 text-center text-gray-500">
          Nenhum poço cadastrado ainda. Toque em “+” para criar o primeiro.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {pocos.map((poco) => (
            <li key={poco.id}>
              <Link
                href={`/pocos/${poco.id}`}
                className="block rounded-lg border border-gray-200 p-4 active:bg-gray-50"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-lg font-semibold">
                    {poco.identificacao}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${coresStatusPoco[poco.status]}`}
                  >
                    {rotulosStatusPoco[poco.status]}
                  </span>
                </div>
                <p className="mt-1 text-gray-600">
                  {poco.obra.nome} — {poco.obra.cliente.nome}
                </p>
                <p className="text-sm text-gray-500">
                  {poco.municipio
                    ? `${poco.municipio}/${poco.uf}`
                    : "Locação não informada"}
                  {poco.profundidadeFinal
                    ? ` · ${poco.profundidadeFinal.toString()} m`
                    : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/pocos/novo"
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-3xl text-white shadow-lg active:bg-blue-700"
        aria-label="Novo poço"
      >
        +
      </Link>
    </main>
  );
}
