import type { CamadaPerfil } from "./litologico";
import type { DadosConstrutivo } from "./construtivo";

type CampoDecimal = { toNumber(): number };

type CamadaEntrada = {
  id: string;
  ordem: number;
  profundidadeInicial: CampoDecimal;
  profundidadeFinal: CampoDecimal;
  descricao: string;
};

type RevestimentoEntrada = {
  id: string;
  profundidadeInicial: CampoDecimal;
  profundidadeFinal: CampoDecimal;
  tipo: "liso" | "filtro";
  diametro: string;
};

type TrechoAnularEntrada = {
  id: string;
  profundidadeInicial: CampoDecimal;
  profundidadeFinal: CampoDecimal;
};

type TesteVazaoEntrada = {
  nivelEstatico: CampoDecimal;
  nivelDinamicoEstabilizado: CampoDecimal | null;
};

export type PocoParaPerfil = {
  profundidadeFinal: CampoDecimal | null;
  camadasLitologicas: CamadaEntrada[];
  revestimentos: RevestimentoEntrada[];
  cimentacoes: TrechoAnularEntrada[];
  preFiltros: TrechoAnularEntrada[];
  testesVazao: TesteVazaoEntrada[];
};

export type DadosParaPerfil = {
  camadas: CamadaPerfil[];
  construtivo: DadosConstrutivo;
  profundidadeTotal: number;
};

// Converte o formato vindo do Prisma (campos Decimal) para o formato plano
// usado pelo desenho do perfil — reaproveitado tanto na tela do poço quanto
// no relatório em PDF, para as duas fontes nunca divergirem.
export function mapearDadosParaPerfil(poco: PocoParaPerfil): DadosParaPerfil {
  const camadas: CamadaPerfil[] = poco.camadasLitologicas.map((camada) => ({
    id: camada.id,
    ordem: camada.ordem,
    profundidadeInicial: camada.profundidadeInicial.toNumber(),
    profundidadeFinal: camada.profundidadeFinal.toNumber(),
    descricao: camada.descricao,
  }));

  const construtivo: DadosConstrutivo = {
    revestimentos: poco.revestimentos.map((trecho) => ({
      id: trecho.id,
      profundidadeInicial: trecho.profundidadeInicial.toNumber(),
      profundidadeFinal: trecho.profundidadeFinal.toNumber(),
      tipo: trecho.tipo,
      diametro: trecho.diametro,
    })),
    cimentacoes: poco.cimentacoes.map((trecho) => ({
      id: trecho.id,
      profundidadeInicial: trecho.profundidadeInicial.toNumber(),
      profundidadeFinal: trecho.profundidadeFinal.toNumber(),
    })),
    preFiltros: poco.preFiltros.map((trecho) => ({
      id: trecho.id,
      profundidadeInicial: trecho.profundidadeInicial.toNumber(),
      profundidadeFinal: trecho.profundidadeFinal.toNumber(),
    })),
    nivelEstatico: poco.testesVazao[0]?.nivelEstatico.toNumber() ?? null,
    nivelDinamico: poco.testesVazao[0]?.nivelDinamicoEstabilizado?.toNumber() ?? null,
  };

  const profundidadeTotal =
    poco.profundidadeFinal?.toNumber() ??
    (camadas.length > 0 ? camadas[camadas.length - 1].profundidadeFinal : 0);

  return { camadas, construtivo, profundidadeTotal };
}

export function temDadosDePerfil(dados: DadosParaPerfil): boolean {
  return (
    dados.camadas.length > 0 ||
    dados.construtivo.revestimentos.length > 0 ||
    dados.construtivo.cimentacoes.length > 0 ||
    dados.construtivo.preFiltros.length > 0
  );
}
