// Converte profundidade real (metros) em posição vertical (pixels) para o
// desenho do perfil do poço. Trechos muito finos (< 1% da profundidade
// total) recebem uma altura mínima em vez de sumir — o desenho fica com uma
// escala "elástica" perto deles, mas a régua de profundidade e as duas
// colunas (litológica e construtiva) usam essa mesma escala para não perder
// a correspondência entre si.
//
// Litologia e perfil construtivo são lançados como listas independentes de
// trechos (uma camada não tem por que coincidir com um trecho de
// revestimento) — por isso a escala é construída a partir da UNIÃO dos
// limites de profundidade de tudo (camadas + revestimento + cimentação +
// pré-filtro), não de uma lista isolada. Um trecho de qualquer coluna que
// caia dentro de um intervalo "fino" da escala unificada também não some.

export type Segmento = {
  profundidadeInicial: number;
  profundidadeFinal: number;
  y0: number;
  y1: number;
  fino: boolean;
};

const ALTURA_MINIMA_TRECHO_FINO = 8;

export function coletarLimites(
  ...listas: { profundidadeInicial: number; profundidadeFinal: number }[][]
): number[] {
  const limites = new Set<number>();
  listas.forEach((lista) => {
    lista.forEach((item) => {
      limites.add(item.profundidadeInicial);
      limites.add(item.profundidadeFinal);
    });
  });
  return Array.from(limites).sort((a, b) => a - b);
}

export function construirEscala(
  limites: number[],
  profundidadeTotal: number,
  pixelsPorMetro: number
): Segmento[] {
  const limiarFino = profundidadeTotal * 0.01;
  const segmentos: Segmento[] = [];
  let y = 0;

  for (let i = 0; i < limites.length - 1; i++) {
    const profundidadeInicial = limites[i];
    const profundidadeFinal = limites[i + 1];
    const espessura = profundidadeFinal - profundidadeInicial;
    if (espessura <= 0) continue;

    const fino = espessura < limiarFino;
    const alturaNatural = espessura * pixelsPorMetro;
    const altura = fino
      ? Math.max(alturaNatural, ALTURA_MINIMA_TRECHO_FINO)
      : Math.max(alturaNatural, 2);

    const y0 = y;
    const y1 = y + altura;
    y = y1;

    segmentos.push({ profundidadeInicial, profundidadeFinal, y0, y1, fino });
  }

  return segmentos;
}

/** Atalho para quando só existe uma lista de trechos (uso isolado/legado). */
export function construirSegmentos(
  trechos: { profundidadeInicial: number; profundidadeFinal: number }[],
  profundidadeTotal: number,
  pixelsPorMetro: number
): Segmento[] {
  const limites = coletarLimites(trechos);
  if (limites.length === 0 || limites[0] !== 0) limites.unshift(0);
  if (limites[limites.length - 1] !== profundidadeTotal) {
    limites.push(profundidadeTotal);
  }
  return construirEscala(limites, profundidadeTotal, pixelsPorMetro);
}

export function alturaTotal(segmentos: Segmento[]): number {
  return segmentos.length === 0 ? 0 : segmentos[segmentos.length - 1].y1;
}

export function profundidadeParaY(
  segmentos: Segmento[],
  profundidade: number
): number {
  if (segmentos.length === 0) return 0;

  for (const segmento of segmentos) {
    if (
      profundidade >= segmento.profundidadeInicial &&
      profundidade <= segmento.profundidadeFinal
    ) {
      const extensao = segmento.profundidadeFinal - segmento.profundidadeInicial;
      const fracao =
        extensao === 0
          ? 0
          : (profundidade - segmento.profundidadeInicial) / extensao;
      return segmento.y0 + fracao * (segmento.y1 - segmento.y0);
    }
  }

  const primeiro = segmentos[0];
  const ultimo = segmentos[segmentos.length - 1];
  return profundidade < primeiro.profundidadeInicial ? primeiro.y0 : ultimo.y1;
}

export function calcularIntervaloRegua(profundidadeTotal: number): number {
  return profundidadeTotal <= 60 ? 5 : 10;
}

export function gerarMarcacoesRegua(profundidadeTotal: number): number[] {
  const intervalo = calcularIntervaloRegua(profundidadeTotal);
  const marcacoes: number[] = [];

  for (let p = 0; p <= profundidadeTotal; p += intervalo) {
    marcacoes.push(p);
  }
  if (marcacoes[marcacoes.length - 1] !== profundidadeTotal) {
    marcacoes.push(profundidadeTotal);
  }

  return marcacoes;
}
