import { prisma } from "@/lib/prisma";
import { CartaoConflito } from "@/components/conflitos/cartao-conflito";

export const dynamic = "force-dynamic";

export default async function PaginaConflitos() {
  const conflitos = await prisma.conflitoEdicao.findMany({
    where: { excluidoEm: null, resolvidoEm: null },
    include: { poco: true, criadoPor: true },
    orderBy: { criadoEm: "asc" },
  });

  return (
    <main className="mx-auto max-w-2xl p-4 pb-24 md:max-w-4xl md:p-8">
      <h1 className="mb-1 text-2xl font-bold">Conflitos de sincronização</h1>
      <p className="mb-6 text-gray-500">
        Alterações lançadas offline que não foram aplicadas porque o poço
        mudou no servidor nesse meio-tempo. Escolha qual versão vale para
        cada uma.
      </p>

      {conflitos.length === 0 ? (
        <p className="mt-8 text-center text-gray-500">
          Nenhum conflito pendente.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {conflitos.map((conflito) => (
            <CartaoConflito
              key={conflito.id}
              conflito={{
                id: conflito.id,
                tipo: conflito.tipo,
                pocoIdentificacao: conflito.poco.identificacao,
                criadoPorNome: conflito.criadoPor.nome,
                criadoEmTexto: new Intl.DateTimeFormat("pt-BR", {
                  dateStyle: "short",
                  timeStyle: "short",
                }).format(conflito.criadoEm),
                dadosServidor: conflito.dadosServidor as Record<string, unknown>,
                dadosLocais: conflito.dadosLocais as Record<string, unknown>,
              }}
            />
          ))}
        </ul>
      )}
    </main>
  );
}
