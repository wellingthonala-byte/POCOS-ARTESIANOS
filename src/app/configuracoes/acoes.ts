"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type EstadoFormularioConfiguracao = {
  erro?: string;
  sucesso?: boolean;
};

function lerCamposConfiguracao(formData: FormData) {
  const nomeEmpresa = String(formData.get("nomeEmpresa") ?? "").trim();
  const logoUrl = String(formData.get("logoUrl") ?? "").trim();
  const cnpj = String(formData.get("cnpj") ?? "").trim();
  const endereco = String(formData.get("endereco") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  if (!nomeEmpresa) throw new Error("Informe o nome da empresa.");

  return {
    nomeEmpresa,
    logoUrl: logoUrl || null,
    cnpj: cnpj || null,
    endereco: endereco || null,
    telefone: telefone || null,
    email: email || null,
  };
}

export async function atualizarConfiguracao(
  _estadoAnterior: EstadoFormularioConfiguracao,
  formData: FormData
): Promise<EstadoFormularioConfiguracao> {
  try {
    const dados = lerCamposConfiguracao(formData);

    const existente = await prisma.configuracao.findFirst();
    if (existente) {
      await prisma.configuracao.update({ where: { id: existente.id }, data: dados });
    } else {
      await prisma.configuracao.create({ data: dados });
    }
  } catch (erro) {
    return { erro: erro instanceof Error ? erro.message : "Erro ao salvar as configurações." };
  }

  revalidatePath("/configuracoes");
  return { sucesso: true };
}
