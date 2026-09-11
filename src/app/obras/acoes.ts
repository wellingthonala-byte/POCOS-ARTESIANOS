"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { obterUsuarioAtualId } from "@/lib/usuario-atual";

export type EstadoFormularioObra = {
  erro?: string;
  sucesso?: boolean;
  obraId?: string;
};

function lerCamposObra(formData: FormData) {
  const clienteId = String(formData.get("clienteId") ?? "").trim();
  const nome = String(formData.get("nome") ?? "").trim();
  const endereco = String(formData.get("endereco") ?? "").trim();
  const municipio = String(formData.get("municipio") ?? "").trim();
  const uf = String(formData.get("uf") ?? "").trim();

  if (!clienteId) throw new Error("Selecione o cliente.");
  if (!nome) throw new Error("Informe o nome da obra.");
  if (!municipio) throw new Error("Informe o município.");
  if (!uf) throw new Error("Informe a UF.");

  return { clienteId, nome, endereco: endereco || null, municipio, uf };
}

function tratarErro(erro: unknown): EstadoFormularioObra {
  return { erro: erro instanceof Error ? erro.message : "Erro ao salvar a obra." };
}

export async function criarObra(
  _estadoAnterior: EstadoFormularioObra,
  formData: FormData
): Promise<EstadoFormularioObra> {
  try {
    const dados = lerCamposObra(formData);
    const criadoPorId = await obterUsuarioAtualId();
    const obra = await prisma.obra.create({ data: { ...dados, criadoPorId } });
    revalidatePath("/obras");
    return { sucesso: true, obraId: obra.id };
  } catch (erro) {
    return tratarErro(erro);
  }
}

export async function atualizarObra(
  obraId: string,
  _estadoAnterior: EstadoFormularioObra,
  formData: FormData
): Promise<EstadoFormularioObra> {
  try {
    const dados = lerCamposObra(formData);
    await prisma.obra.update({ where: { id: obraId }, data: dados });
    revalidatePath("/obras");
    return { sucesso: true, obraId };
  } catch (erro) {
    return tratarErro(erro);
  }
}
