// Converte profundidade real (metros) em posição vertical (pixels) para o
// desenho do perfil do poço. Camadas muito finas (< 1% da profundidade
// total) recebem uma altura mínima em vez de sumir — o desenho fica com uma
// escala "elástica" perto delas, mas a régua de profundidade usa essa mesma
// função para não perder a correspondência entre as colunas e as marcações.

export type Segmento = {
  profundidadeInicial: number;
  profundidadeFinal: number;
  y0: number;
  y1: number;
  fino: boolean;
};

const ALTURA_MINIMA_CAMADA_FINA = 8;

export function construirSegmentos(
  camadas: { profundidadeInicial: number; profundidadeFinal: number }[],
  profundidadeTotal: number,
  pixelsPorMetro: number
): Segmento[] {
  const limiarFino = profundidadeTotal * 0.01;
  let y = 0;

  return camadas.map((camada) => {
    const espessura = camada.profundidadeFinal - camada.profundidadeInicial;
    const fino = espessura < limiarFino;
    const alturaNatural = espessura * pixelsPorMetro;
    const altura = fino
      ? Math.max(alturaNatural, ALTURA_MINIMA_CAMADA_FINA)
      : Math.max(alturaNatural, 2);

    const y0 = y;
    const y1 = y + altura;
    y = y1;

    return {
      profundidadeInicial: camada.profundidadeInicial,
      profundidadeFinal: camada.profundidadeFinal,
      y0,
      y1,
      fino,
    };
  });
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
