import { prisma } from "@/lib/prisma";

/**
 * Placeholder até a fase de autenticação existir: todo registro exige um
 * criado_por_id, então usamos o primeiro usuário admin cadastrado pelo seed
 * como "usuário atual". Substituir pelo usuário da sessão autenticada
 * quando o login for implementado.
 */
export async function obterUsuarioAtualId(): Promise<string> {
  const usuario = await prisma.usuario.findFirst({
    where: { papel: "admin", excluidoEm: null },
    orderBy: { criadoEm: "asc" },
  });

  if (!usuario) {
    throw new Error(
      "Nenhum usuário administrador encontrado. Rode `npx prisma db seed` antes de usar o sistema."
    );
  }

  return usuario.id;
}
