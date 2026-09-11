"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { Prisma } from "@/generated/prisma/client";
import {
  StatusPoco,
  MetodoObtencaoCoordenada,
  MetodoPerfuracao,
  TipoRevestimento,
  TipoTesteVazao,
  TipoAnexo,
} from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { obterUsuarioAtualId } from "@/lib/usuario-atual";
import {
  caminhoArquivoAnexo,
  caminhoDiretorioAnexos,
  obterExtensaoValidada,
  TAMANHO_MAXIMO_ANEXO_BYTES,
} from "@/lib/anexos/armazenamento";

export type EstadoFormularioPoco = {
  erro?: string;
  sucesso?: boolean;
  pocoId?: string;
  conflito?: boolean;
  atualizadoEm?: string;
  // Nunca setado pela action em si — só pelo wrapper de fila offline
  // (envolverAcaoComFilaOffline) quando a gravação foi guardada localmente
  // por falta de rede. Fica aqui, e não como um tipo local por tela, pra
  // toda tela que use esse wrapper poder ler `estado.pendente` sem
  // precisar de um tipo próprio.
  pendente?: boolean;
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

// ---------------------------------------------------------------------------
// Detecção de conflito (Fase 5, etapa 4): telas de "sobrescrever campo"
// (identificação, perfuração, níveis e vazão) mandam junto o atualizado_em
// que viram quando a tela carregou (`baseAtualizadoEm` no formData — ver
// useAutosavePoco/FormularioIdentificacaoLocacao). Se o registro no
// servidor já tiver mudado desde então — outro aparelho, ou o escritório
// editando enquanto o técnico estava offline —, a gravação NÃO é aplicada:
// as duas versões ficam em `conflito_edicao` para revisão manual, nunca
// sobrescrevendo silenciosamente (ver /conflitos).
// ---------------------------------------------------------------------------

type EstadoAtualParaConflito = { atualizadoEm: Date; dados: Record<string, unknown> };

async function aplicarComVerificacaoDeConflito(
  pocoId: string,
  tipo: string,
  formData: FormData,
  buscarEstadoAtual: () => Promise<EstadoAtualParaConflito | null>,
  aplicar: (estadoAtual: EstadoAtualParaConflito | null) => Promise<Date>
): Promise<{ conflito: boolean; atualizadoEm?: string }> {
  const baseAtualizadoEm = formData.get("baseAtualizadoEm");
  const atual = await buscarEstadoAtual();

  const temConflito =
    typeof baseAtualizadoEm === "string" &&
    baseAtualizadoEm !== "" &&
    atual !== null &&
    atual.atualizadoEm.toISOString() !== baseAtualizadoEm;

  if (temConflito) {
    const criadoPorId = await obterUsuarioAtualId();
    const dadosLocais: Record<string, string> = {};
    formData.forEach((valor, chave) => {
      if (chave !== "baseAtualizadoEm") dadosLocais[chave] = String(valor);
    });

    await prisma.conflitoEdicao.create({
      data: {
        pocoId,
        tipo,
        dadosServidor: atual.dados as Prisma.InputJsonValue,
        dadosLocais: dadosLocais as Prisma.InputJsonValue,
        criadoPorId,
      },
    });

    return { conflito: true, atualizadoEm: atual.atualizadoEm.toISOString() };
  }

  const novoAtualizadoEm = await aplicar(atual);
  return { conflito: false, atualizadoEm: novoAtualizadoEm.toISOString() };
}

// ---------------------------------------------------------------------------
// Helpers para listas de trechos encadeados (litologia, revestimento,
// cimentação, pré-filtro): cada trecho novo só informa a profundidade
// final — a inicial vem do último trecho já lançado (ou zero).
// ---------------------------------------------------------------------------

function lerProfundidadeFinal(formData: FormData): number {
  const texto = String(formData.get("profundidadeFinal") ?? "")
    .trim()
    .replace(",", ".");
  const valor = Number(texto);
  if (!texto || Number.isNaN(valor) || valor <= 0) {
    throw new Error("Profundidade final inválida.");
  }
  return valor;
}

function calcularProfundidadeInicial(
  ultimoTrecho: { profundidadeFinal: Prisma.Decimal } | null
): number {
  return ultimoTrecho ? ultimoTrecho.profundidadeFinal.toNumber() : 0;
}

function validarProfundidadeEncadeada(
  profundidadeFinal: number,
  profundidadeInicial: number
) {
  if (profundidadeFinal <= profundidadeInicial) {
    throw new Error(
      "A profundidade final deve ser maior que a profundidade inicial do trecho."
    );
  }
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

async function buscarEstadoIdentificacao(
  pocoId: string
): Promise<EstadoAtualParaConflito | null> {
  const poco = await prisma.poco.findUnique({
    where: { id: pocoId },
    select: {
      atualizadoEm: true,
      identificacao: true,
      obraId: true,
      status: true,
      municipio: true,
      uf: true,
      latitude: true,
      longitude: true,
      metodoObtencaoCoordenada: true,
    },
  });
  if (!poco) return null;

  return {
    atualizadoEm: poco.atualizadoEm,
    dados: {
      identificacao: poco.identificacao,
      obraId: poco.obraId,
      status: poco.status,
      municipio: poco.municipio,
      uf: poco.uf,
      latitude: poco.latitude.toString(),
      longitude: poco.longitude.toString(),
      metodoObtencaoCoordenada: poco.metodoObtencaoCoordenada,
    },
  };
}

export async function atualizarIdentificacaoLocacao(
  pocoId: string,
  _estadoAnterior: EstadoFormularioPoco,
  formData: FormData
): Promise<EstadoFormularioPoco> {
  try {
    const dados = lerCamposIdentificacaoLocacao(formData);

    const resultado = await aplicarComVerificacaoDeConflito(
      pocoId,
      "identificacao.atualizar",
      formData,
      () => buscarEstadoIdentificacao(pocoId),
      async () => {
        const atualizado = await prisma.poco.update({ where: { id: pocoId }, data: dados });
        return atualizado.atualizadoEm;
      }
    );

    if (!resultado.conflito) {
      revalidatePath("/pocos");
    }
    return {
      sucesso: true,
      pocoId,
      conflito: resultado.conflito,
      atualizadoEm: resultado.atualizadoEm,
    };
  } catch (erro) {
    return tratarErro(erro);
  }
}

// Sem bloqueio por dado dependente (diferente de excluirCliente/
// excluirObra): poço é a ponta da hierarquia, e suas próprias rotas
// (/pocos/[id]/...) já exigem `excluidoEm: null` — excluir o poço já torna
// litologia/construtivo/teste de vazão/análises/anexos inacessíveis pela
// tela, sem precisar apagar ou cascatear exclusão em cada tabela filha.
export async function excluirPoco(
  pocoId: string,
  _estadoAnterior: EstadoFormularioPoco,
  _formData: FormData
): Promise<EstadoFormularioPoco> {
  void _estadoAnterior;
  void _formData;
  try {
    await prisma.poco.update({
      where: { id: pocoId },
      data: { excluidoEm: new Date() },
    });
  } catch (erro) {
    return tratarErro(erro);
  }

  // redirect() fora do try/catch e no lugar de router.push no cliente —
  // mesmo raciocínio de excluirCliente/excluirObra: a própria Server
  // Action provoca um refresh de `/pocos/[id]`, que também exige
  // `excluidoEm: null` e cairia em notFound() antes do componente cliente
  // reagir a `estado.sucesso`.
  revalidatePath("/pocos");
  redirect("/pocos");
}

function lerCamposPerfuracao(formData: FormData) {
  const metodoPerfuracao = String(formData.get("metodoPerfuracao") ?? "").trim();
  const dataInicioPerfuracao = String(formData.get("dataInicioPerfuracao") ?? "").trim();
  const dataFimPerfuracao = String(formData.get("dataFimPerfuracao") ?? "").trim();
  const profundidadeFinal = String(formData.get("profundidadeFinal") ?? "")
    .trim()
    .replace(",", ".");
  const numeroArt = String(formData.get("numeroArt") ?? "").trim();
  const responsavelTecnicoId = String(formData.get("responsavelTecnicoId") ?? "").trim();

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
    responsavelTecnicoId: responsavelTecnicoId || null,
  };
}

async function buscarEstadoPerfuracao(
  pocoId: string
): Promise<EstadoAtualParaConflito | null> {
  const poco = await prisma.poco.findUnique({
    where: { id: pocoId },
    select: {
      atualizadoEm: true,
      metodoPerfuracao: true,
      dataInicioPerfuracao: true,
      dataFimPerfuracao: true,
      profundidadeFinal: true,
      numeroArt: true,
      responsavelTecnicoId: true,
    },
  });
  if (!poco) return null;

  return {
    atualizadoEm: poco.atualizadoEm,
    dados: {
      metodoPerfuracao: poco.metodoPerfuracao,
      dataInicioPerfuracao: poco.dataInicioPerfuracao?.toISOString() ?? null,
      dataFimPerfuracao: poco.dataFimPerfuracao?.toISOString() ?? null,
      profundidadeFinal: poco.profundidadeFinal?.toString() ?? null,
      numeroArt: poco.numeroArt,
      responsavelTecnicoId: poco.responsavelTecnicoId,
    },
  };
}

export async function atualizarPerfuracao(
  pocoId: string,
  _estadoAnterior: EstadoFormularioPoco,
  formData: FormData
): Promise<EstadoFormularioPoco> {
  try {
    const dados = lerCamposPerfuracao(formData);

    const resultado = await aplicarComVerificacaoDeConflito(
      pocoId,
      "perfuracao.atualizar",
      formData,
      () => buscarEstadoPerfuracao(pocoId),
      async () => {
        const atualizado = await prisma.poco.update({ where: { id: pocoId }, data: dados });
        return atualizado.atualizadoEm;
      }
    );

    if (!resultado.conflito) {
      revalidatePath("/pocos");
    }
    return {
      sucesso: true,
      pocoId,
      conflito: resultado.conflito,
      atualizadoEm: resultado.atualizadoEm,
    };
  } catch (erro) {
    return tratarErro(erro);
  }
}

export async function adicionarCamadaLitologica(
  pocoId: string,
  _estadoAnterior: EstadoFormularioPoco,
  formData: FormData
): Promise<EstadoFormularioPoco> {
  try {
    const descricao = String(formData.get("descricao") ?? "").trim();
    if (!descricao) throw new Error("Informe a descrição da camada.");
    const profundidadeFinal = lerProfundidadeFinal(formData);
    const criadoPorId = await obterUsuarioAtualId();

    await prisma.$transaction(async (tx) => {
      const ultimaCamada = await tx.camadaLitologica.findFirst({
        where: { pocoId, excluidoEm: null },
        orderBy: { ordem: "desc" },
      });
      const profundidadeInicial = calcularProfundidadeInicial(ultimaCamada);
      validarProfundidadeEncadeada(profundidadeFinal, profundidadeInicial);

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
    return tratarErro(erro);
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

// ---------------------------------------------------------------------------
// Perfil construtivo: revestimento, cimentação, pré-filtro
// ---------------------------------------------------------------------------

export async function adicionarRevestimento(
  pocoId: string,
  _estadoAnterior: EstadoFormularioPoco,
  formData: FormData
): Promise<EstadoFormularioPoco> {
  try {
    const tipo = String(formData.get("tipo") ?? "").trim();
    const diametro = String(formData.get("diametro") ?? "").trim();
    const material = String(formData.get("material") ?? "").trim();
    if (!diametro) throw new Error("Informe o diâmetro.");
    const tipoValidado = validarEnum(
      Object.values(TipoRevestimento),
      tipo,
      "Tipo de revestimento"
    );
    const profundidadeFinal = lerProfundidadeFinal(formData);
    const criadoPorId = await obterUsuarioAtualId();

    await prisma.$transaction(async (tx) => {
      const ultimoTrecho = await tx.revestimento.findFirst({
        where: { pocoId, excluidoEm: null },
        orderBy: { ordem: "desc" },
      });
      const profundidadeInicial = calcularProfundidadeInicial(ultimoTrecho);
      validarProfundidadeEncadeada(profundidadeFinal, profundidadeInicial);

      await tx.revestimento.create({
        data: {
          pocoId,
          ordem: (ultimoTrecho?.ordem ?? 0) + 1,
          profundidadeInicial,
          profundidadeFinal,
          tipo: tipoValidado,
          material: material || null,
          diametro,
          criadoPorId,
        },
      });
    });
  } catch (erro) {
    return tratarErro(erro);
  }

  revalidatePath(`/pocos/${pocoId}/construtivo`);
  return { sucesso: true };
}

export async function removerUltimoRevestimento(
  pocoId: string,
  _estadoAnterior: EstadoFormularioPoco,
  _formData: FormData
): Promise<EstadoFormularioPoco> {
  void _estadoAnterior;
  void _formData;
  try {
    const ultimoTrecho = await prisma.revestimento.findFirst({
      where: { pocoId, excluidoEm: null },
      orderBy: { ordem: "desc" },
    });
    if (!ultimoTrecho) {
      return { erro: "Não há trecho para remover." };
    }
    await prisma.revestimento.update({
      where: { id: ultimoTrecho.id },
      data: { excluidoEm: new Date() },
    });
  } catch (erro) {
    return { erro: erro instanceof Error ? erro.message : "Erro ao remover o revestimento." };
  }

  revalidatePath(`/pocos/${pocoId}/construtivo`);
  return { sucesso: true };
}

export async function adicionarCimentacao(
  pocoId: string,
  _estadoAnterior: EstadoFormularioPoco,
  formData: FormData
): Promise<EstadoFormularioPoco> {
  try {
    const profundidadeFinal = lerProfundidadeFinal(formData);
    const criadoPorId = await obterUsuarioAtualId();

    await prisma.$transaction(async (tx) => {
      const ultimoTrecho = await tx.cimentacao.findFirst({
        where: { pocoId, excluidoEm: null },
        orderBy: { ordem: "desc" },
      });
      const profundidadeInicial = calcularProfundidadeInicial(ultimoTrecho);
      validarProfundidadeEncadeada(profundidadeFinal, profundidadeInicial);

      await tx.cimentacao.create({
        data: {
          pocoId,
          ordem: (ultimoTrecho?.ordem ?? 0) + 1,
          profundidadeInicial,
          profundidadeFinal,
          criadoPorId,
        },
      });
    });
  } catch (erro) {
    return tratarErro(erro);
  }

  revalidatePath(`/pocos/${pocoId}/construtivo`);
  return { sucesso: true };
}

export async function removerUltimaCimentacao(
  pocoId: string,
  _estadoAnterior: EstadoFormularioPoco,
  _formData: FormData
): Promise<EstadoFormularioPoco> {
  void _estadoAnterior;
  void _formData;
  try {
    const ultimoTrecho = await prisma.cimentacao.findFirst({
      where: { pocoId, excluidoEm: null },
      orderBy: { ordem: "desc" },
    });
    if (!ultimoTrecho) {
      return { erro: "Não há trecho para remover." };
    }
    await prisma.cimentacao.update({
      where: { id: ultimoTrecho.id },
      data: { excluidoEm: new Date() },
    });
  } catch (erro) {
    return { erro: erro instanceof Error ? erro.message : "Erro ao remover a cimentação." };
  }

  revalidatePath(`/pocos/${pocoId}/construtivo`);
  return { sucesso: true };
}

export async function adicionarPreFiltro(
  pocoId: string,
  _estadoAnterior: EstadoFormularioPoco,
  formData: FormData
): Promise<EstadoFormularioPoco> {
  try {
    const granulometria = String(formData.get("granulometria") ?? "").trim();
    const profundidadeFinal = lerProfundidadeFinal(formData);
    const criadoPorId = await obterUsuarioAtualId();

    await prisma.$transaction(async (tx) => {
      const ultimoTrecho = await tx.preFiltro.findFirst({
        where: { pocoId, excluidoEm: null },
        orderBy: { ordem: "desc" },
      });
      const profundidadeInicial = calcularProfundidadeInicial(ultimoTrecho);
      validarProfundidadeEncadeada(profundidadeFinal, profundidadeInicial);

      await tx.preFiltro.create({
        data: {
          pocoId,
          ordem: (ultimoTrecho?.ordem ?? 0) + 1,
          profundidadeInicial,
          profundidadeFinal,
          granulometria: granulometria || null,
          criadoPorId,
        },
      });
    });
  } catch (erro) {
    return tratarErro(erro);
  }

  revalidatePath(`/pocos/${pocoId}/construtivo`);
  return { sucesso: true };
}

export async function removerUltimoPreFiltro(
  pocoId: string,
  _estadoAnterior: EstadoFormularioPoco,
  _formData: FormData
): Promise<EstadoFormularioPoco> {
  void _estadoAnterior;
  void _formData;
  try {
    const ultimoTrecho = await prisma.preFiltro.findFirst({
      where: { pocoId, excluidoEm: null },
      orderBy: { ordem: "desc" },
    });
    if (!ultimoTrecho) {
      return { erro: "Não há trecho para remover." };
    }
    await prisma.preFiltro.update({
      where: { id: ultimoTrecho.id },
      data: { excluidoEm: new Date() },
    });
  } catch (erro) {
    return { erro: erro instanceof Error ? erro.message : "Erro ao remover o pré-filtro." };
  }

  revalidatePath(`/pocos/${pocoId}/construtivo`);
  return { sucesso: true };
}

// ---------------------------------------------------------------------------
// Níveis e vazão (resumo simples — o teste de vazão completo, com leituras
// por tempo e gráficos, é lançado na Fase 6)
// ---------------------------------------------------------------------------

function lerNumeroOpcional(formData: FormData, campo: string): number | null {
  const texto = String(formData.get(campo) ?? "")
    .trim()
    .replace(",", ".");
  if (!texto) return null;
  const valor = Number(texto);
  if (Number.isNaN(valor) || valor <= 0) {
    throw new Error(`Valor inválido em "${campo}".`);
  }
  return valor;
}

async function buscarEstadoNiveisVazao(
  pocoId: string
): Promise<EstadoAtualParaConflito | null> {
  const testeExistente = await prisma.testeVazao.findFirst({
    where: { pocoId, excluidoEm: null },
    orderBy: { criadoEm: "asc" },
    select: {
      atualizadoEm: true,
      nivelEstatico: true,
      nivelDinamicoEstabilizado: true,
      vazaoEstabilizada: true,
    },
  });
  // Sem teste lançado ainda: nada a comparar — a gravação só vai criar o
  // primeiro, não há como conflitar com um estado que não existe.
  if (!testeExistente) return null;

  return {
    atualizadoEm: testeExistente.atualizadoEm,
    dados: {
      nivelEstatico: testeExistente.nivelEstatico.toString(),
      nivelDinamicoEstabilizado:
        testeExistente.nivelDinamicoEstabilizado?.toString() ?? null,
      vazaoEstabilizada: testeExistente.vazaoEstabilizada?.toString() ?? null,
    },
  };
}

export async function atualizarNiveisVazao(
  pocoId: string,
  _estadoAnterior: EstadoFormularioPoco,
  formData: FormData
): Promise<EstadoFormularioPoco> {
  try {
    const nivelEstatico = lerNumeroOpcional(formData, "nivelEstatico");
    const nivelDinamicoEstabilizado = lerNumeroOpcional(
      formData,
      "nivelDinamicoEstabilizado"
    );
    const vazaoEstabilizada = lerNumeroOpcional(formData, "vazaoEstabilizada");

    // Nada preenchido ainda (ou só o dinâmico/vazão, sem o estático) — não
    // dá para gravar o teste sem o nível estático, que é obrigatório no
    // banco. Aguarda o usuário terminar de digitar, sem mostrar erro.
    if (nivelEstatico === null) {
      return { sucesso: true };
    }

    if (
      nivelDinamicoEstabilizado !== null &&
      nivelDinamicoEstabilizado <= nivelEstatico
    ) {
      throw new Error(
        "O nível dinâmico deve ser maior que o nível estático."
      );
    }

    const criadoPorId = await obterUsuarioAtualId();

    const resultado = await aplicarComVerificacaoDeConflito(
      pocoId,
      "niveisVazao.atualizar",
      formData,
      () => buscarEstadoNiveisVazao(pocoId),
      async () => {
        const testeExistente = await prisma.testeVazao.findFirst({
          where: { pocoId, excluidoEm: null },
          orderBy: { criadoEm: "asc" },
        });

        if (testeExistente) {
          const atualizado = await prisma.testeVazao.update({
            where: { id: testeExistente.id },
            data: { nivelEstatico, nivelDinamicoEstabilizado, vazaoEstabilizada },
          });
          return atualizado.atualizadoEm;
        }

        const criado = await prisma.testeVazao.create({
          data: {
            pocoId,
            tipo: "continuo",
            dataHoraInicio: new Date(),
            nivelEstatico,
            nivelDinamicoEstabilizado,
            vazaoEstabilizada,
            criadoPorId,
          },
        });
        return criado.atualizadoEm;
      }
    );

    if (!resultado.conflito) {
      revalidatePath(`/pocos/${pocoId}/niveis-vazao`);
    }
    return {
      sucesso: true,
      conflito: resultado.conflito,
      atualizadoEm: resultado.atualizadoEm,
    };
  } catch (erro) {
    return tratarErro(erro);
  }
}

// ---------------------------------------------------------------------------
// Teste de vazão completo (Fase 6): tipo do ensaio e leituras ao longo do
// tempo. Opera no MESMO registro teste_vazao que a etapa 5 do cadastro do
// poço já cria (nível estático obrigatório) — por isso as duas ações
// abaixo exigem que um teste já exista, orientando a lançar o nível
// estático por lá primeiro em vez de duplicar esse campo aqui.
// ---------------------------------------------------------------------------

async function buscarTesteVazaoAtual(pocoId: string) {
  return prisma.testeVazao.findFirst({
    where: { pocoId, excluidoEm: null },
    orderBy: { criadoEm: "asc" },
  });
}

const MENSAGEM_SEM_TESTE =
  'Lance ao menos o nível estático na etapa "Níveis e vazão" antes de configurar o teste completo.';

export async function atualizarTipoEInicioTeste(
  pocoId: string,
  _estadoAnterior: EstadoFormularioPoco,
  formData: FormData
): Promise<EstadoFormularioPoco> {
  try {
    const tipo = String(formData.get("tipo") ?? "");
    const dataHoraInicio = String(formData.get("dataHoraInicio") ?? "").trim();
    if (!dataHoraInicio) throw new Error("Informe a data/hora de início do teste.");

    const testeAtual = await buscarTesteVazaoAtual(pocoId);
    if (!testeAtual) throw new Error(MENSAGEM_SEM_TESTE);

    await prisma.testeVazao.update({
      where: { id: testeAtual.id },
      data: {
        tipo: validarEnum(Object.values(TipoTesteVazao), tipo, "Tipo de teste"),
        dataHoraInicio: new Date(dataHoraInicio),
      },
    });
  } catch (erro) {
    return tratarErro(erro);
  }

  revalidatePath(`/pocos/${pocoId}/teste-vazao`);
  return { sucesso: true };
}

function lerNumeroObrigatorio(
  formData: FormData,
  campo: string,
  rotulo: string
): number {
  const texto = String(formData.get(campo) ?? "").trim().replace(",", ".");
  const valor = Number(texto);
  if (!texto || Number.isNaN(valor)) {
    throw new Error(`Informe ${rotulo}.`);
  }
  return valor;
}

export async function adicionarLeituraTeste(
  pocoId: string,
  _estadoAnterior: EstadoFormularioPoco,
  formData: FormData
): Promise<EstadoFormularioPoco> {
  try {
    const tempoMinutos = lerNumeroObrigatorio(formData, "tempoMinutos", "o tempo decorrido");
    const nivelDinamico = lerNumeroObrigatorio(formData, "nivelDinamico", "o nível dinâmico");
    if (tempoMinutos < 0) throw new Error("Tempo decorrido não pode ser negativo.");

    const vazaoTexto = String(formData.get("vazao") ?? "").trim().replace(",", ".");
    let vazao: number | null = null;
    if (vazaoTexto) {
      vazao = Number(vazaoTexto);
      if (Number.isNaN(vazao) || vazao <= 0) throw new Error("Vazão inválida.");
    }

    const criadoPorId = await obterUsuarioAtualId();

    await prisma.$transaction(async (tx) => {
      const teste = await tx.testeVazao.findFirst({
        where: { pocoId, excluidoEm: null },
        orderBy: { criadoEm: "asc" },
      });
      if (!teste) throw new Error(MENSAGEM_SEM_TESTE);

      if (nivelDinamico <= teste.nivelEstatico.toNumber()) {
        throw new Error("O nível dinâmico deve ser maior que o nível estático.");
      }
      if (teste.tipo === "escalonado" && vazao === null) {
        throw new Error("Informe a vazão do estágio — obrigatória no teste escalonado.");
      }

      const ultimaLeitura = await tx.testeLeitura.findFirst({
        where: { testeVazaoId: teste.id, excluidoEm: null },
        orderBy: { tempoMinutos: "desc" },
      });
      if (ultimaLeitura && tempoMinutos <= ultimaLeitura.tempoMinutos.toNumber()) {
        throw new Error("O tempo decorrido deve ser maior que o da última leitura.");
      }

      await tx.testeLeitura.create({
        data: { testeVazaoId: teste.id, tempoMinutos, nivelDinamico, vazao, criadoPorId },
      });
    });
  } catch (erro) {
    return tratarErro(erro);
  }

  revalidatePath(`/pocos/${pocoId}/teste-vazao`);
  return { sucesso: true };
}

export async function removerUltimaLeituraTeste(
  pocoId: string,
  _estadoAnterior: EstadoFormularioPoco,
  _formData: FormData
): Promise<EstadoFormularioPoco> {
  void _estadoAnterior;
  void _formData;
  try {
    const teste = await buscarTesteVazaoAtual(pocoId);
    if (!teste) return { erro: "Nenhum teste configurado ainda." };

    const ultimaLeitura = await prisma.testeLeitura.findFirst({
      where: { testeVazaoId: teste.id, excluidoEm: null },
      orderBy: { tempoMinutos: "desc" },
    });
    if (!ultimaLeitura) {
      return { erro: "Não há leitura para remover." };
    }
    await prisma.testeLeitura.update({
      where: { id: ultimaLeitura.id },
      data: { excluidoEm: new Date() },
    });
  } catch (erro) {
    return { erro: erro instanceof Error ? erro.message : "Erro ao remover a leitura." };
  }

  revalidatePath(`/pocos/${pocoId}/teste-vazao`);
  return { sucesso: true };
}

// ---------------------------------------------------------------------------
// Análise físico-química da água (Fase 6, etapa 2). Diferente das listas de
// trecho (litologia, construtivo, leituras do teste de vazão), parâmetros
// não têm ordem/encadeamento — um laudo de laboratório lista vários
// parâmetros de uma vez, sem relação de "onde o anterior parou". Por isso
// adicionar/remover aqui não reaproveita useListaTrechos: cada parâmetro é
// independente, removido pelo próprio id, não "o último".
//
// De propósito SEM fila de sincronização offline: dado de laudo de
// laboratório normalmente é lançado bem depois da coleta, já com internet
// (ao contrário de litologia/perfuração/teste de vazão, lançados na hora,
// no local da obra) — o ganho não compensa generalizar o registro da fila
// (hoje todo pensado pra actions com um único `pocoId` como primeiro
// parâmetro; aqui há action com dois/três ids amarrados). Ainda assim, uma
// gravação sem rede não pode quebrar a tela — `envolverAcaoSemFila`
// (`envolver-acao.ts`) mostra um erro claro em vez de estourar
// "Application error", só sem guardar a tentativa pra sincronizar depois.
// ---------------------------------------------------------------------------

export type EstadoAnalise = {
  erro?: string;
  sucesso?: boolean;
  analiseId?: string;
};

function tratarErroAnalise(erro: unknown): EstadoAnalise {
  return { erro: erro instanceof Error ? erro.message : "Erro ao salvar." };
}

function lerData(formData: FormData, campo: string, rotulo: string): Date {
  const texto = String(formData.get(campo) ?? "").trim();
  if (!texto) throw new Error(`Informe ${rotulo}.`);
  return new Date(texto);
}

export async function criarAnalise(
  pocoId: string,
  _estadoAnterior: EstadoAnalise,
  formData: FormData
): Promise<EstadoAnalise> {
  try {
    const dataColeta = lerData(formData, "dataColeta", "a data da coleta");
    const laboratorio = String(formData.get("laboratorio") ?? "").trim();
    const criadoPorId = await obterUsuarioAtualId();

    const analise = await prisma.analiseAgua.create({
      data: { pocoId, dataColeta, laboratorio: laboratorio || null, criadoPorId },
    });

    revalidatePath(`/pocos/${pocoId}/analises`);
    return { sucesso: true, analiseId: analise.id };
  } catch (erro) {
    return tratarErroAnalise(erro);
  }
}

export async function atualizarAnalise(
  analiseId: string,
  pocoId: string,
  _estadoAnterior: EstadoAnalise,
  formData: FormData
): Promise<EstadoAnalise> {
  try {
    const dataColeta = lerData(formData, "dataColeta", "a data da coleta");
    const laboratorio = String(formData.get("laboratorio") ?? "").trim();

    await prisma.analiseAgua.update({
      where: { id: analiseId },
      data: { dataColeta, laboratorio: laboratorio || null },
    });
  } catch (erro) {
    return tratarErroAnalise(erro);
  }

  revalidatePath(`/pocos/${pocoId}/analises/${analiseId}`);
  return { sucesso: true };
}

export async function excluirAnalise(
  analiseId: string,
  pocoId: string,
  _estadoAnterior: EstadoAnalise,
  _formData: FormData
): Promise<EstadoAnalise> {
  void _estadoAnterior;
  void _formData;
  try {
    await prisma.analiseAgua.update({
      where: { id: analiseId },
      data: { excluidoEm: new Date() },
    });
  } catch (erro) {
    return tratarErroAnalise(erro);
  }

  revalidatePath(`/pocos/${pocoId}/analises`);
  return { sucesso: true };
}

function lerNumeroObrigatorioAnalise(
  formData: FormData,
  campo: string,
  rotulo: string
): number {
  const texto = String(formData.get(campo) ?? "").trim().replace(",", ".");
  const valor = Number(texto);
  if (!texto || Number.isNaN(valor)) throw new Error(`Informe ${rotulo}.`);
  return valor;
}

function lerNumeroOpcionalAnalise(formData: FormData, campo: string): number | null {
  const texto = String(formData.get(campo) ?? "").trim().replace(",", ".");
  if (!texto) return null;
  const valor = Number(texto);
  if (Number.isNaN(valor)) throw new Error(`Valor inválido em "${campo}".`);
  return valor;
}

export async function adicionarParametro(
  analiseId: string,
  pocoId: string,
  _estadoAnterior: EstadoAnalise,
  formData: FormData
): Promise<EstadoAnalise> {
  try {
    const nome = String(formData.get("nome") ?? "").trim();
    if (!nome) throw new Error("Informe o nome do parâmetro.");
    const unidade = String(formData.get("unidade") ?? "").trim();
    if (!unidade) throw new Error("Informe a unidade do parâmetro.");

    const valor = lerNumeroObrigatorioAnalise(formData, "valor", "o valor medido");
    const vmpMinimo = lerNumeroOpcionalAnalise(formData, "vmpMinimo");
    const vmpMaximo = lerNumeroOpcionalAnalise(formData, "vmpMaximo");
    if (vmpMinimo !== null && vmpMaximo !== null && vmpMinimo > vmpMaximo) {
      throw new Error("O VMP mínimo não pode ser maior que o VMP máximo.");
    }

    const criadoPorId = await obterUsuarioAtualId();
    await prisma.parametro.create({
      data: {
        analiseAguaId: analiseId,
        nome,
        valor,
        unidade,
        vmpMinimo,
        vmpMaximo,
        criadoPorId,
      },
    });
  } catch (erro) {
    return tratarErroAnalise(erro);
  }

  revalidatePath(`/pocos/${pocoId}/analises/${analiseId}`);
  return { sucesso: true };
}

export async function removerParametro(
  parametroId: string,
  pocoId: string,
  analiseId: string,
  _estadoAnterior: EstadoAnalise,
  _formData: FormData
): Promise<EstadoAnalise> {
  void _estadoAnterior;
  void _formData;
  try {
    await prisma.parametro.update({
      where: { id: parametroId },
      data: { excluidoEm: new Date() },
    });
  } catch (erro) {
    return tratarErroAnalise(erro);
  }

  revalidatePath(`/pocos/${pocoId}/analises/${analiseId}`);
  return { sucesso: true };
}

// ---------------------------------------------------------------------------
// Anexos (Fase 6, etapa 3): foto, ART, croqui ou laudo vinculado ao poço.
// Arquivo físico vai pro disco local (uploads/, fora de src/ e de public/ —
// ver src/lib/anexos/armazenamento.ts); o banco guarda só o registro e o
// caminho de download (arquivoUrl aponta pra Route Handler, nunca pro
// caminho físico em disco).
//
// De propósito SEM fila de sincronização offline, mesmo raciocínio da
// análise físico-química: envolverAcaoComFilaOffline serializa o payload
// como Record<string,string> pra guardar em IndexedDB, e um File não cabe
// nesse formato sem reescrever a fila pra suportar Blob — desproporcional
// pro ganho aqui (diferente de litologia/perfuração, o plano de produto já
// trata "fotos offline" como fila separada de upload em segundo plano, uma
// entrega futura). envolverAcaoSemFila garante que a tela não quebra sem
// rede, só sem guardar a tentativa.
// ---------------------------------------------------------------------------

export type EstadoAnexo = {
  erro?: string;
  sucesso?: boolean;
};

function tratarErroAnexo(erro: unknown): EstadoAnexo {
  return { erro: erro instanceof Error ? erro.message : "Erro ao salvar o anexo." };
}

export async function adicionarAnexo(
  pocoId: string,
  _estadoAnterior: EstadoAnexo,
  formData: FormData
): Promise<EstadoAnexo> {
  void _estadoAnterior;
  try {
    const arquivo = formData.get("arquivo");
    if (!(arquivo instanceof File) || arquivo.size === 0) {
      throw new Error("Selecione um arquivo.");
    }
    if (arquivo.size > TAMANHO_MAXIMO_ANEXO_BYTES) {
      throw new Error("O arquivo excede o tamanho máximo de 15MB.");
    }

    const tipo = validarEnum(
      Object.values(TipoAnexo),
      String(formData.get("tipo") ?? ""),
      "Tipo de anexo"
    );
    const legenda = String(formData.get("legenda") ?? "").trim();
    const incluirNoRelatorio = formData.get("incluirNoRelatorio") === "on";

    const nomeOriginal = arquivo.name || "arquivo";
    const extensao = obterExtensaoValidada(nomeOriginal);
    const criadoPorId = await obterUsuarioAtualId();
    const id = randomUUID();

    await mkdir(caminhoDiretorioAnexos(pocoId), { recursive: true });
    const bytes = Buffer.from(await arquivo.arrayBuffer());
    await writeFile(caminhoArquivoAnexo(pocoId, id, extensao), bytes);

    await prisma.anexo.create({
      data: {
        id,
        pocoId,
        tipo,
        arquivoUrl: `/pocos/${pocoId}/anexos/${id}/arquivo`,
        nomeArquivo: nomeOriginal,
        legenda: legenda || null,
        incluirNoRelatorio,
        criadoPorId,
      },
    });
  } catch (erro) {
    return tratarErroAnexo(erro);
  }

  revalidatePath(`/pocos/${pocoId}/anexos`);
  return { sucesso: true };
}

export async function removerAnexo(
  anexoId: string,
  pocoId: string,
  _estadoAnterior: EstadoAnexo,
  _formData: FormData
): Promise<EstadoAnexo> {
  void _estadoAnterior;
  void _formData;
  try {
    // Exclusão lógica: o arquivo físico continua em disco de propósito,
    // mesma convenção de "dado de campo não se apaga" aplicada ao arquivo,
    // não só à linha do banco.
    await prisma.anexo.update({
      where: { id: anexoId },
      data: { excluidoEm: new Date() },
    });
  } catch (erro) {
    return tratarErroAnexo(erro);
  }

  revalidatePath(`/pocos/${pocoId}/anexos`);
  return { sucesso: true };
}
