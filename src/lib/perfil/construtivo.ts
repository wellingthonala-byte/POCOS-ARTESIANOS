import { profundidadeParaY, type Segmento } from "./escala";

export type TrechoRevestimentoPerfil = {
  id: string;
  profundidadeInicial: number;
  profundidadeFinal: number;
  tipo: "liso" | "filtro";
  diametro: string; // ex.: '6"', '8 5/8"'
};

export type TrechoAnularPerfil = {
  id: string;
  profundidadeInicial: number;
  profundidadeFinal: number;
};

export type DadosConstrutivo = {
  revestimentos: TrechoRevestimentoPerfil[];
  cimentacoes: TrechoAnularPerfil[];
  preFiltros: TrechoAnularPerfil[];
  nivelEstatico: number | null;
  nivelDinamico: number | null;
};

const DIAMETRO_PADRAO_POLEGADAS = 6;
const MARGEM_ANULAR_POLEGADAS = 2;
const ESCALA_DIAMETRO_PX_POR_POLEGADA = 6;

// Diâmetro é guardado como string sem conversão ("6\"", "8 5/8\"") — aqui é
// só para calcular a largura do desenho, nunca persistido de volta.
export function analisarDiametroPolegadas(diametro: string): number {
  const limpo = diametro.replace(/"/g, "").trim();
  const partes = limpo.split(" ").filter(Boolean);
  let total = 0;
  for (const parte of partes) {
    if (parte.includes("/")) {
      const [numerador, denominador] = parte.split("/").map(Number);
      if (denominador) total += numerador / denominador;
    } else {
      const valor = Number(parte);
      if (!Number.isNaN(valor)) total += valor;
    }
  }
  return total > 0 ? total : DIAMETRO_PADRAO_POLEGADAS;
}

export function calcularLarguraColunaConstrutivo(
  revestimentos: TrechoRevestimentoPerfil[]
): number {
  const maiorDiametro =
    revestimentos.length === 0
      ? DIAMETRO_PADRAO_POLEGADAS
      : Math.max(...revestimentos.map((r) => analisarDiametroPolegadas(r.diametro)));
  return (maiorDiametro + MARGEM_ANULAR_POLEGADAS) * ESCALA_DIAMETRO_PX_POR_POLEGADA + 20;
}

function buscarRevestimentoContendo(
  revestimentos: TrechoRevestimentoPerfil[],
  profundidade: number
): TrechoRevestimentoPerfil | null {
  return (
    revestimentos.find(
      (r) => profundidade >= r.profundidadeInicial && profundidade <= r.profundidadeFinal
    ) ?? null
  );
}

// Cimentação e pré-filtro ficam no espaço anular ao redor do revestimento —
// usa o trecho de revestimento mais próximo daquela profundidade para saber
// a largura do "tubo" ali, já que essas listas são lançadas de forma
// independente e podem não ter os mesmos limites.
function buscarRevestimentoParaAnular(
  revestimentos: TrechoRevestimentoPerfil[],
  profundidadeReferencia: number
): TrechoRevestimentoPerfil | null {
  const exato = buscarRevestimentoContendo(revestimentos, profundidadeReferencia);
  if (exato) return exato;
  if (revestimentos.length === 0) return null;

  return revestimentos.reduce((maisProximo, atual) => {
    const distancia = (r: TrechoRevestimentoPerfil) =>
      Math.min(
        Math.abs(r.profundidadeInicial - profundidadeReferencia),
        Math.abs(r.profundidadeFinal - profundidadeReferencia)
      );
    return distancia(atual) < distancia(maisProximo) ? atual : maisProximo;
  });
}

export const defsPatternsConstrutivo = `
  <pattern id="padrao-filtro-construtivo" width="10" height="6" patternUnits="userSpaceOnUse">
    <rect width="10" height="6" fill="#dcdcdc"/>
    <line x1="0" y1="3" x2="6" y2="3" stroke="#555" stroke-width="1.3"/>
  </pattern>
  <pattern id="padrao-cimentacao" width="6" height="6" patternUnits="userSpaceOnUse">
    <rect width="6" height="6" fill="#c9c9c9"/>
    <circle cx="1.5" cy="1.5" r="0.6" fill="#8a8a8a"/>
    <circle cx="4.5" cy="4.5" r="0.6" fill="#8a8a8a"/>
  </pattern>
  <pattern id="padrao-prefiltro-construtivo" width="8" height="8" patternUnits="userSpaceOnUse">
    <rect width="8" height="8" fill="#f0e6cc"/>
    <circle cx="2" cy="5" r="1.3" fill="#c2a26a"/>
    <circle cx="6" cy="2" r="1.1" fill="#c2a26a"/>
  </pattern>
`;

function retangulo(
  x: number,
  y: number,
  largura: number,
  altura: number,
  atributos: string
): string {
  if (largura <= 0 || altura <= 0) return "";
  return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${largura.toFixed(1)}" height="${altura.toFixed(1)}" ${atributos} />`;
}

/**
 * Gera o furo, o revestimento, a cimentação, o pré-filtro e os níveis
 * d'água da coluna construtiva, usando a escala compartilhada com a coluna
 * litológica. Não inclui `<svg>`/`<defs>`.
 */
export function gerarMarkupColunaConstrutiva(
  dados: DadosConstrutivo,
  segmentos: Segmento[],
  opcoes: { xCentro: number; paddingTopo: number; profundidadeTotal: number }
): string {
  const { revestimentos, cimentacoes, preFiltros, nivelEstatico, nivelDinamico } = dados;
  const { xCentro, paddingTopo, profundidadeTotal } = opcoes;

  const y = (profundidade: number) =>
    profundidadeParaY(segmentos, profundidade) + paddingTopo;
  const meiaLarguraPx = (diametroPolegadas: number) =>
    (diametroPolegadas * ESCALA_DIAMETRO_PX_POR_POLEGADA) / 2;

  const furos: string[] = [];
  const casings: string[] = [];

  revestimentos.forEach((trecho) => {
    const y0 = y(trecho.profundidadeInicial);
    const y1 = y(trecho.profundidadeFinal);
    const diametroCasing = analisarDiametroPolegadas(trecho.diametro);
    const meiaCasing = meiaLarguraPx(diametroCasing);
    const meiaFuro = meiaLarguraPx(diametroCasing + MARGEM_ANULAR_POLEGADAS);

    furos.push(
      retangulo(xCentro - meiaFuro, y0, meiaFuro * 2, y1 - y0, 'fill="#ffffff" stroke="#333" stroke-width="1"')
    );

    const preenchimentoCasing =
      trecho.tipo === "filtro" ? 'fill="url(#padrao-filtro-construtivo)"' : 'fill="#b0b0b0"';
    casings.push(
      retangulo(xCentro - meiaCasing, y0, meiaCasing * 2, y1 - y0, `${preenchimentoCasing} stroke="#333" stroke-width="0.75"`)
    );
  });

  // Trecho aberto (sem revestimento) abaixo do último revestimento lançado —
  // comum em poços em rocha cristalina, onde o poço fica exposto sem tubo.
  if (revestimentos.length > 0) {
    const ultimo = revestimentos[revestimentos.length - 1];
    if (ultimo.profundidadeFinal < profundidadeTotal) {
      const y0 = y(ultimo.profundidadeFinal);
      const y1 = y(profundidadeTotal);
      const meiaFuroAberto = meiaLarguraPx(analisarDiametroPolegadas(ultimo.diametro));
      furos.push(
        retangulo(xCentro - meiaFuroAberto, y0, meiaFuroAberto * 2, y1 - y0, 'fill="#ffffff" stroke="#333" stroke-width="1"')
      );
    }
  } else if (profundidadeTotal > 0) {
    // Sem nenhum revestimento lançado ainda: desenha só o furo com diâmetro padrão.
    const meiaFuroPadrao = meiaLarguraPx(DIAMETRO_PADRAO_POLEGADAS);
    furos.push(
      retangulo(xCentro - meiaFuroPadrao, y(0), meiaFuroPadrao * 2, y(profundidadeTotal) - y(0), 'fill="#ffffff" stroke="#333" stroke-width="1"')
    );
  }

  function gerarFaixaAnular(
    trechos: TrechoAnularPerfil[],
    preenchimento: string
  ): string {
    return trechos
      .map((trecho) => {
        const y0 = y(trecho.profundidadeInicial);
        const y1 = y(trecho.profundidadeFinal);
        const referencia = buscarRevestimentoParaAnular(
          revestimentos,
          (trecho.profundidadeInicial + trecho.profundidadeFinal) / 2
        );
        const diametroCasing = referencia
          ? analisarDiametroPolegadas(referencia.diametro)
          : DIAMETRO_PADRAO_POLEGADAS;
        const meiaCasing = meiaLarguraPx(diametroCasing);
        const meiaFuro = meiaLarguraPx(diametroCasing + MARGEM_ANULAR_POLEGADAS);
        const larguraFaixa = meiaFuro - meiaCasing;

        const faixaEsquerda = retangulo(
          xCentro - meiaFuro,
          y0,
          larguraFaixa,
          y1 - y0,
          `${preenchimento} stroke="#333" stroke-width="0.5"`
        );
        const faixaDireita = retangulo(
          xCentro + meiaCasing,
          y0,
          larguraFaixa,
          y1 - y0,
          `${preenchimento} stroke="#333" stroke-width="0.5"`
        );
        return faixaEsquerda + faixaDireita;
      })
      .join("\n");
  }

  const cimentacaoMarkup = gerarFaixaAnular(cimentacoes, 'fill="url(#padrao-cimentacao)"');
  const preFiltroMarkup = gerarFaixaAnular(preFiltros, 'fill="url(#padrao-prefiltro-construtivo)"');

  const larguraNiveis = calcularLarguraColunaConstrutivo(revestimentos) / 2 + 20;

  function linhaNivel(profundidade: number | null, rotulo: string, cor: string): string {
    if (profundidade === null) return "";
    const yNivel = y(profundidade);
    return `
      <line x1="${(xCentro - larguraNiveis).toFixed(1)}" y1="${yNivel.toFixed(1)}" x2="${(xCentro + larguraNiveis).toFixed(1)}" y2="${yNivel.toFixed(1)}" stroke="${cor}" stroke-width="1.25" stroke-dasharray="5,3" />
      <text x="${(xCentro + larguraNiveis + 4).toFixed(1)}" y="${(yNivel + 3).toFixed(1)}" font-family="Arial, sans-serif" font-size="10" fill="${cor}">▽ ${rotulo}</text>
    `;
  }

  const niveisMarkup =
    linhaNivel(nivelEstatico, "NE", "#1a6fb0") + linhaNivel(nivelDinamico, "ND", "#c0392b");

  return [
    furos.join("\n"),
    cimentacaoMarkup,
    preFiltroMarkup,
    casings.join("\n"),
    niveisMarkup,
  ].join("\n");
}
