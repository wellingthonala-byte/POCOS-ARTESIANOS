import { prisma } from "@/lib/prisma";

export async function buscarDadosRelatorio(pocoId: string) {
  const poco = await prisma.poco.findFirst({
    where: { id: pocoId, excluidoEm: null },
    include: {
      obra: { include: { cliente: true } },
      responsavelTecnico: true,
      camadasLitologicas: {
        where: { excluidoEm: null },
        orderBy: { ordem: "asc" },
      },
      revestimentos: {
        where: { excluidoEm: null },
        orderBy: { ordem: "asc" },
      },
      cimentacoes: {
        where: { excluidoEm: null },
        orderBy: { ordem: "asc" },
      },
      preFiltros: {
        where: { excluidoEm: null },
        orderBy: { ordem: "asc" },
      },
      testesVazao: {
        where: { excluidoEm: null },
        orderBy: { criadoEm: "asc" },
        include: {
          leituras: {
            where: { excluidoEm: null },
            orderBy: { tempoMinutos: "asc" },
          },
        },
      },
      analisesAgua: {
        where: { excluidoEm: null },
        orderBy: { dataColeta: "asc" },
        include: {
          parametros: { where: { excluidoEm: null }, orderBy: { criadoEm: "asc" } },
        },
      },
      anexos: {
        where: { excluidoEm: null },
        orderBy: { criadoEm: "asc" },
      },
    },
  });

  if (!poco) return null;

  const configuracao = await prisma.configuracao.findFirst();

  return { poco, configuracao };
}

export type DadosRelatorio = NonNullable<Awaited<ReturnType<typeof buscarDadosRelatorio>>>;
