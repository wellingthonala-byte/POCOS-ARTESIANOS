"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { TipoPessoa } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { obterUsuarioAtualId } from "@/lib/usuario-atual";

export type EstadoFormularioCliente = {
  erro?: string;
  sucesso?: boolean;
  clienteId?: string;
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

function lerCamposCliente(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const tipoPessoa = String(formData.get("tipoPessoa") ?? TipoPessoa.fisica);
  const documento = String(formData.get("documento") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const endereco = String(formData.get("endereco") ?? "").trim();
  const municipio = String(formData.get("municipio") ?? "").trim();
  const uf = String(formData.get("uf") ?? "").trim();

  if (!nome) throw new Error("Informe o nome do cliente.");
  if (!documento) throw new Error("Informe o CPF ou CNPJ.");

  return {
    nome,
    tipoPessoa: validarEnum(Object.values(TipoPessoa), tipoPessoa, "Tipo de pessoa"),
    documento,
    telefone: telefone || null,
    email: email || null,
    endereco: endereco || null,
    municipio: municipio || null,
    uf: uf || null,
  };
}

function tratarErro(erro: unknown): EstadoFormularioCliente {
  return { erro: erro instanceof Error ? erro.message : "Erro ao salvar o cliente." };
}

export async function criarCliente(
  _estadoAnterior: EstadoFormularioCliente,
  formData: FormData
): Promise<EstadoFormularioCliente> {
  try {
    const dados = lerCamposCliente(formData);
    const criadoPorId = await obterUsuarioAtualId();
    const cliente = await prisma.cliente.create({ data: { ...dados, criadoPorId } });
    revalidatePath("/clientes");
    return { sucesso: true, clienteId: cliente.id };
  } catch (erro) {
    return tratarErro(erro);
  }
}

export async function atualizarCliente(
  clienteId: string,
  _estadoAnterior: EstadoFormularioCliente,
  formData: FormData
): Promise<EstadoFormularioCliente> {
  try {
    const dados = lerCamposCliente(formData);
    await prisma.cliente.update({ where: { id: clienteId }, data: dados });
    revalidatePath("/clientes");
    return { sucesso: true, clienteId };
  } catch (erro) {
    return tratarErro(erro);
  }
}

// Exclusão lógica bloqueada se houver obra ativa vinculada — evita que uma
// obra (e os poços dela) fique "órfã", apontando pra um cliente já
// excluído, sem precisar cascatear a exclusão (dado de campo não se
// apaga, e cascatear escondería poço com dado técnico sem aviso nenhum).
export async function excluirCliente(
  clienteId: string,
  _estadoAnterior: EstadoFormularioCliente,
  _formData: FormData
): Promise<EstadoFormularioCliente> {
  void _estadoAnterior;
  void _formData;
  try {
    const obrasVinculadas = await prisma.obra.count({
      where: { clienteId, excluidoEm: null },
    });
    if (obrasVinculadas > 0) {
      throw new Error(
        `Não é possível excluir: há ${obrasVinculadas} obra(s) vinculada(s) a este cliente.`
      );
    }
    await prisma.cliente.update({
      where: { id: clienteId },
      data: { excluidoEm: new Date() },
    });
  } catch (erro) {
    return tratarErro(erro);
  }

  // redirect() fora do try/catch de propósito: ele funciona lançando uma
  // exceção especial que o Next intercepta — cair dentro do catch faria
  // tratarErro engolir isso como erro genérico. Redirecionar aqui (em vez
  // de router.push no cliente ao ver `sucesso`) evita uma corrida real: a
  // própria Server Action já provoca um refresh da rota atual, e como
  // `/clientes/[id]/editar` também exige `excluidoEm: null`, esse refresh
  // cai em notFound() ANTES do componente cliente conseguir reagir a
  // `estado.sucesso` — o usuário via a tela de 404 em vez de ir pra lista
  // (confirmado excluindo de verdade e vendo o redirecionamento falhar).
  revalidatePath("/clientes");
  redirect("/clientes");
}
