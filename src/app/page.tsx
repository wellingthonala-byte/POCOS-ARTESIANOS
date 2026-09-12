import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CartaoEstatistica } from "@/components/ui/cartao-estatistica";
import { CartaoLista } from "@/components/ui/cartao-lista";
import { rotulosStatusPoco, coresStatusPoco } from "@/lib/rotulos";

export const dynamic = "force-dynamic";

export default async function Inicio() {
  const [
    totalEmPerfuracao,
    totalPlanejado,
    totalConcluido,
    totalObras,
    totalClientes,
    totalConflitos,
    pocosRecentes,
  ] = await Promise.all([
    prisma.poco.count({ where: { excluidoEm: null, status: "em_perfuracao" } }),
    prisma.poco.count({ where: { excluidoEm: null, status: "planejado" } }),
    prisma.poco.count({ where: { excluidoEm: null, status: "concluido" } }),
    prisma.obra.count({ where: { excluidoEm: null } }),
    prisma.cliente.count({ where: { excluidoEm: null } }),
    prisma.conflitoEdicao.count({ where: { resolvidoEm: null } }),
    prisma.poco.findMany({
      where: { excluidoEm: null },
      include: { obra: { include: { cliente: true } } },
      orderBy: { criadoEm: "desc" },
      take: 5,
    }),
  ]);

  return (
    <main className="mx-auto max-w-2xl p-4 pb-24 md:max-w-4xl md:p-8">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Início</h1>
      <p className="mb-6 text-gray-500">Visão geral do que está em andamento.</p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <CartaoEstatistica
          rotulo="Em perfuração"
          valor={totalEmPerfuracao}
          href="/pocos"
        />
        <CartaoEstatistica rotulo="Planejados" valor={totalPlanejado} href="/pocos" />
        <CartaoEstatistica rotulo="Concluídos" valor={totalConcluido} href="/pocos" />
        <CartaoEstatistica
          rotulo="Conflitos pendentes"
          valor={totalConflitos}
          href="/conflitos"
          destaque={totalConflitos > 0}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <CartaoEstatistica rotulo="Obras cadastradas" valor={totalObras} href="/obras" />
        <CartaoEstatistica rotulo="Clientes cadastrados" valor={totalClientes} href="/clientes" />
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Poços recentes</h2>
        <Link href="/pocos" className="text-sm font-medium text-blue-600">
          Ver todos
        </Link>
      </div>

      {pocosRecentes.length === 0 ? (
        <p className="mt-4 text-gray-500">Nenhum poço cadastrado ainda.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {pocosRecentes.map((poco) => (
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
              </CartaoLista>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
