"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { StatusPoco, MetodoObtencaoCoordenada } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { obterUsuarioAtualId } from "@/lib/usuario-atual";

export type EstadoFormularioPoco = {
  erro?: string;
  sucesso?: boolean;
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
    await prisma.poco.create({ data: { ...dados, criadoPorId } });
  } catch (erro) {
    return tratarErro(erro);
  }

  revalidatePath("/pocos");
  return { sucesso: true };
}

export async function atualizarIdentificacaoLocacao(
  pocoId: string,
  _estadoAnterior: EstadoFormularioPoco,
  formData: FormData
): Promise<EstadoFormularioPoco> {
  try {
    const dados = lerCamposIdentificacaoLocacao(formData);
    await prisma.poco.update({ where: { id: pocoId }, data: dados });
  } catch (erro) {
    return tratarErro(erro);
  }

  revalidatePath("/pocos");
  return { sucesso: true };
}
