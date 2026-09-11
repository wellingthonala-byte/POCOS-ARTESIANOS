"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { obterUsuarioAtualId } from "@/lib/usuario-atual";
import { registroAcoesOffline } from "@/lib/offline/registro-acoes";
import { objetoParaFormData } from "@/lib/offline/fila-sincronizacao";

export type EstadoResolverConflito = { erro?: string; sucesso?: boolean };

// Revisão manual no escritório (Fase 5, etapa 4): um conflito nunca é
// resolvido automaticamente — alguém decide explicitamente qual das duas
// versões vale. "Aplicar dado offline" chama a mesma server action que a
// fila de sincronização usaria (registro-acoes.ts), mas sem
// `baseAtualizadoEm` no formData — a ausência dessa marca já faz a action
// aplicar direto, sem checar conflito de novo (ver
// aplicarComVerificacaoDeConflito em pocos/acoes.ts): é uma decisão
// consciente do escritório, não uma reaplicação cega da fila.
export async function resolverConflito(
  conflitoId: string,
  resolucao: "manter_servidor" | "aplicar_local"
): Promise<EstadoResolverConflito> {
  try {
    const conflito = await prisma.conflitoEdicao.findFirst({
      where: { id: conflitoId, excluidoEm: null, resolvidoEm: null },
    });
    if (!conflito) {
      return { erro: "Conflito não encontrado ou já resolvido." };
    }

    if (resolucao === "aplicar_local") {
      const acao = registroAcoesOffline[conflito.tipo];
      if (!acao) {
        return { erro: `Tipo de conflito desconhecido: ${conflito.tipo}` };
      }

      const dadosLocais = conflito.dadosLocais as Record<string, string>;
      const formData = objetoParaFormData(dadosLocais);
      const resultado = await acao(conflito.pocoId, {}, formData);
      if (resultado.erro) {
        return { erro: resultado.erro };
      }
    }

    const resolvidoPorId = await obterUsuarioAtualId();
    await prisma.conflitoEdicao.update({
      where: { id: conflitoId },
      data: { resolvidoEm: new Date(), resolvidoPorId },
    });

    revalidatePath("/conflitos");
    return { sucesso: true };
  } catch (erro) {
    return {
      erro: erro instanceof Error ? erro.message : "Erro ao resolver o conflito.",
    };
  }
}
