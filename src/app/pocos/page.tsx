import { prisma } from "@/lib/prisma";
import { rotulosStatusPoco, coresStatusPoco } from "@/lib/rotulos";
import { EspelharListaPocosOffline } from "@/components/pwa/espelhar-lista-pocos-offline";
import { CartaoLista } from "@/components/ui/cartao-lista";
import { BotaoNovoFlutuante } from "@/components/ui/botao-novo-flutuante";

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
      <h1 className="mb-4 text-2xl font-bold text-gray-900">Poços</h1>

      {pocos.length === 0 ? (
        <p className="mt-8 text-center text-gray-500">
          Nenhum poço cadastrado ainda. Toque em &ldquo;+&rdquo; para criar o primeiro.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {pocos.map((poco) => (
            <li key={poco.id}>
              <CartaoLista href={`/pocos/${poco.id}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-lg font-semibold text-gray-900">
                    {poco.identificacao}
                  </span>
                  <span
                    className={`rounded-sm px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${coresStatusPoco[poco.status]}`}
                  >
                    {rotulosStatusPoco[poco.status]}
                  </span>
                </div>
                <p className="mt-1 text-gray-700">
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
              </CartaoLista>
            </li>
          ))}
        </ul>
      )}

      <BotaoNovoFlutuante href="/pocos/novo" rotulo="Novo poço" />
    </main>
  );
}
