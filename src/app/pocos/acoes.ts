"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import {
  StatusPoco,
  MetodoObtencaoCoordenada,
  MetodoPerfuracao,
} from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { obterUsuarioAtualId } from "@/lib/usuario-atual";

export type EstadoFormularioPoco = {
  erro?: string;
  sucesso?: boolean;
  pocoId?: string;
};

function validarEnum<T extends string>(
  valoresValidos: readonly T[],
  valor: string,
  rotulo: string
): T {
  if (!(valoresValidos as readonly string[]).includes(valor)) {
    throw new Error(`${rotulo} inválido.`);
  }
  return valor as T;
}

function lerCamposIdentificacaoLocacao(formData: FormData) {
  const identificacao = String(formData.get("identificacao") ?? "").trim();
  const obraId = String(formData.get("obraId") ?? "").trim();
  const status = String(formData.get("status") ?? StatusPoco.planejado);
  const municipio = String(formData.get("municipio") ?? "").trim();
  const uf = String(formData.get("uf") ?? "").trim();
  const latitude = String(formData.get("latitude") ?? "").trim().replace(",", ".");
  const longitude = String(formData.get("longitude") ?? "").trim().replace(",", ".");
  const metodoObtencaoCoordenada = String(
    formData.get("metodoObtencaoCoordenada") ?? MetodoObtencaoCoordenada.manual
  );

  if (!identificacao) throw new Error("Informe a identificação do poço.");
  if (!obraId) throw new Error("Selecione a obra.");
  if (!latitude || !longitude) throw new Error("Informe latitude e longitude.");

  const latitudeNumero = Number(latitude);
  const longitudeNumero = Number(longitude);

  if (Number.isNaN(latitudeNumero) || latitudeNumero < -90 || latitudeNumero > 90) {
    throw new Error("Latitude inválida — use um valor entre -90 e 90.");
  }
  if (Number.isNaN(longitudeNumero) || longitudeNumero < -180 || longitudeNumero > 180) {
    throw new Error("Longitude inválida — use um valor entre -180 e 180.");
  }

  return {
    identificacao,
    obraId,
    status: validarEnum(Object.values(StatusPoco), status, "Status"),
    municipio: municipio || null,
    uf: uf || null,
    latitude: latitudeNumero,
    longitude: longitudeNumero,
    metodoObtencaoCoordenada: validarEnum(
      Object.values(MetodoObtencaoCoordenada),
      metodoObtencaoCoordenada,
      "Método de obtenção da coordenada"
    ),
  };
}

function tratarErro(erro: unknown): EstadoFormularioPoco {
  if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2002") {
    return { erro: "Já existe um poço com essa identificação nesta obra." };
  }
  return { erro: erro instanceof Error ? erro.message : "Erro ao salvar o poço." };
}

export async function criarPoco(
  _estadoAnterior: EstadoFormularioPoco,
  formData: FormData
): Promise<EstadoFormularioPoco> {
  try {
    const dados = lerCamposIdentificacaoLocacao(formData);
    const criadoPorId = await obterUsuarioAtualId();
    const poco = await prisma.poco.create({ data: { ...dados, criadoPorId } });
    revalidatePath("/pocos");
    return { sucesso: true, pocoId: poco.id };
  } catch (erro) {
    return tratarErro(erro);
  }
}

export async function atualizarIdentificacaoLocacao(
  pocoId: string,
  _estadoAnterior: EstadoFormularioPoco,
  formData: FormData
): Promise<EstadoFormularioPoco> {
  try {
    const dados = lerCamposIdentificacaoLocacao(formData);
    await prisma.poco.update({ where: { id: pocoId }, data: dados });
    revalidatePath("/pocos");
    return { sucesso: true, pocoId };
  } catch (erro) {
    return tratarErro(erro);
  }
}

function lerCamposPerfuracao(formData: FormData) {
  const metodoPerfuracao = String(formData.get("metodoPerfuracao") ?? "").trim();
  const dataInicioPerfuracao = String(formData.get("dataInicioPerfuracao") ?? "").trim();
  const dataFimPerfuracao = String(formData.get("dataFimPerfuracao") ?? "").trim();
  const profundidadeFinal = String(formData.get("profundidadeFinal") ?? "")
    .trim()
    .replace(",", ".");
  const numeroArt = String(formData.get("numeroArt") ?? "").trim();

  if (dataInicioPerfuracao && dataFimPerfuracao) {
    if (new Date(dataFimPerfuracao) < new Date(dataInicioPerfuracao)) {
      throw new Error("A data de fim não pode ser anterior à data de início.");
    }
  }

  let profundidadeFinalNumero: number | null = null;
  if (profundidadeFinal) {
    profundidadeFinalNumero = Number(profundidadeFinal);
    if (Number.isNaN(profundidadeFinalNumero) || profundidadeFinalNumero <= 0) {
      throw new Error("Profundidade final inválida.");
    }
  }

  return {
    metodoPerfuracao: metodoPerfuracao
      ? validarEnum(Object.values(MetodoPerfuracao), metodoPerfuracao, "Método de perfuração")
      : null,
    dataInicioPerfuracao: dataInicioPerfuracao ? new Date(dataInicioPerfuracao) : null,
    dataFimPerfuracao: dataFimPerfuracao ? new Date(dataFimPerfuracao) : null,
    profundidadeFinal: profundidadeFinalNumero,
    numeroArt: numeroArt || null,
  };
}

export async function atualizarPerfuracao(
  pocoId: string,
  _estadoAnterior: EstadoFormularioPoco,
  formData: FormData
): Promise<EstadoFormularioPoco> {
  try {
    const dados = lerCamposPerfuracao(formData);
    await prisma.poco.update({ where: { id: pocoId }, data: dados });
    revalidatePath("/pocos");
    return { sucesso: true, pocoId };
  } catch (erro) {
    return tratarErro(erro);
  }
}

export async function adicionarCamadaLitologica(
  pocoId: string,
  _estadoAnterior: EstadoFormularioPoco,
  formData: FormData
): Promise<EstadoFormularioPoco> {
  const descricao = String(formData.get("descricao") ?? "").trim();
  const profundidadeFinalTexto = String(formData.get("profundidadeFinal") ?? "")
    .trim()
    .replace(",", ".");

  if (!descricao) return { erro: "Informe a descrição da camada." };

  const profundidadeFinal = Number(profundidadeFinalTexto);
  if (!profundidadeFinalTexto || Number.isNaN(profundidadeFinal) || profundidadeFinal <= 0) {
    return { erro: "Profundidade final inválida." };
  }

  try {
    const criadoPorId = await obterUsuarioAtualId();

    await prisma.$transaction(async (tx) => {
      const ultimaCamada = await tx.camadaLitologica.findFirst({
        where: { pocoId, excluidoEm: null },
        orderBy: { ordem: "desc" },
      });

      const profundidadeInicial = ultimaCamada
        ? ultimaCamada.profundidadeFinal.toNumber()
        : 0;

      if (profundidadeFinal <= profundidadeInicial) {
        throw new Error(
          "A profundidade final deve ser maior que a profundidade inicial da camada."
        );
      }

      await tx.camadaLitologica.create({
        data: {
          pocoId,
          ordem: (ultimaCamada?.ordem ?? 0) + 1,
          profundidadeInicial,
          profundidadeFinal,
          descricao,
          criadoPorId,
        },
      });
    });
  } catch (erro) {
    return { erro: erro instanceof Error ? erro.message : "Erro ao salvar a camada." };
  }

  revalidatePath(`/pocos/${pocoId}/litologia`);
  return { sucesso: true };
}

export async function removerUltimaCamadaLitologica(
  pocoId: string,
  _estadoAnterior: EstadoFormularioPoco,
  _formData: FormData
): Promise<EstadoFormularioPoco> {
  void _estadoAnterior;
  void _formData;
  try {
    const ultimaCamada = await prisma.camadaLitologica.findFirst({
      where: { pocoId, excluidoEm: null },
      orderBy: { ordem: "desc" },
    });
    if (!ultimaCamada) {
      return { erro: "Não há camada para remover." };
    }
    await prisma.camadaLitologica.update({
      where: { id: ultimaCamada.id },
      data: { excluidoEm: new Date() },
    });
  } catch (erro) {
    return { erro: erro instanceof Error ? erro.message : "Erro ao remover a camada." };
  }

  revalidatePath(`/pocos/${pocoId}/litologia`);
  return { sucesso: true };
}
