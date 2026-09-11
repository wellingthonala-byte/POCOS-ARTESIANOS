import {
  coletarLimites,
  construirEscala,
  alturaTotal,
  gerarMarcacoesRegua,
  profundidadeParaY,
} from "./escala";
import {
  gerarMarkupColunaLitologica,
  defsPatternsLitologicos,
  LARGURA_LABEL_LITOLOGICO,
  LARGURA_COLUNA_LITOLOGICO,
  type CamadaPerfil,
} from "./litologico";
import {
  gerarMarkupColunaConstrutiva,
  defsPatternsConstrutivo,
  calcularLarguraColunaConstrutivo,
  type DadosConstrutivo,
} from "./construtivo";

const LARGURA_REGUA = 70;
const ESPACO_REGUA_CONSTRUTIVO = 30;
const ESPACO_NIVEIS = 90;
const PADDING_TOPO = 20;
const PADDING_BASE = 20;

export type { CamadaPerfil, DadosConstrutivo };

/**
 * Gera o SVG completo do perfil do poço: coluna litológica (com rótulos) à
 * esquerda, régua de profundidade compartilhada no meio e coluna construtiva
 * (furo, revestimento, cimentação, pré-filtro, níveis) à direita. As duas
 * colunas usam a mesma escala "elástica" construída a partir da união dos
 * limites de profundidade de todos os dados (camadas + trechos construtivos)
 * — ver comentário em `escala.ts`.
 */
export function gerarSvgPerfilPoco(dados: {
  camadas: CamadaPerfil[];
  construtivo: DadosConstrutivo;
  profundidadeTotal: number;
  pixelsPorMetro: number;
}): string {
  const { camadas, construtivo, profundidadeTotal, pixelsPorMetro } = dados;
  const { revestimentos, cimentacoes, preFiltros } = construtivo;

  const semDados =
    profundidadeTotal <= 0 ||
    (camadas.length === 0 &&
      revestimentos.length === 0 &&
      cimentacoes.length === 0 &&
      preFiltros.length === 0);

  if (semDados) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60">
      <text x="10" y="30" font-family="Arial, sans-serif" font-size="12" fill="#666">
        Sem dados lançados.
      </text>
    </svg>`;
  }

  const limites = coletarLimites(camadas, revestimentos, cimentacoes, preFiltros);
  if (limites.length === 0 || limites[0] !== 0) limites.unshift(0);
  if (limites[limites.length - 1] !== profundidadeTotal) limites.push(profundidadeTotal);

  const segmentos = construirEscala(limites, profundidadeTotal, pixelsPorMetro);
  const alturaColuna = alturaTotal(segmentos);
  const marcacoesRegua = gerarMarcacoesRegua(profundidadeTotal);

  const xColuna = LARGURA_LABEL_LITOLOGICO;
  const xRegua = xColuna + LARGURA_COLUNA_LITOLOGICO;
  const larguraConstrutivo = calcularLarguraColunaConstrutivo(revestimentos);
  const xCentroConstrutivo = xRegua + LARGURA_REGUA + ESPACO_REGUA_CONSTRUTIVO + larguraConstrutivo / 2;
  const larguraTotal = xCentroConstrutivo + larguraConstrutivo / 2 + ESPACO_NIVEIS;

  const { markup: markupLitologico, alturaRotulos } = gerarMarkupColunaLitologica(
    camadas,
    segmentos,
    {
      xColuna,
      larguraLabel: LARGURA_LABEL_LITOLOGICO,
      paddingTopo: PADDING_TOPO,
      profundidadeTotal,
    }
  );

  const markupConstrutivo = gerarMarkupColunaConstrutiva(construtivo, segmentos, {
    xCentro: xCentroConstrutivo,
    paddingTopo: PADDING_TOPO,
    profundidadeTotal,
  });

  const alturaConteudo = Math.max(alturaColuna, alturaRotulos);
  const alturaTotalSvg = alturaConteudo + PADDING_TOPO + PADDING_BASE;

  const marcacoesSvg = marcacoesRegua
    .map((profundidade) => {
      const y = profundidadeParaY(segmentos, profundidade) + PADDING_TOPO;
      return `
        <line x1="${xRegua}" y1="${y.toFixed(1)}" x2="${xRegua + 8}" y2="${y.toFixed(1)}" stroke="#333" stroke-width="1" />
        <text x="${xRegua + 12}" y="${(y + 3.5).toFixed(1)}" font-family="Arial, sans-serif" font-size="9" fill="#333">${profundidade.toFixed(0)} m</text>
      `;
    })
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${larguraTotal.toFixed(1)}" height="${alturaTotalSvg.toFixed(1)}" viewBox="0 0 ${larguraTotal.toFixed(1)} ${alturaTotalSvg.toFixed(1)}">
    <defs>${defsPatternsLitologicos}${defsPatternsConstrutivo}</defs>
    <rect x="0" y="0" width="${larguraTotal.toFixed(1)}" height="${alturaTotalSvg.toFixed(1)}" fill="#ffffff" />
    ${markupLitologico}
    <line x1="${xRegua}" y1="${PADDING_TOPO}" x2="${xRegua}" y2="${(alturaColuna + PADDING_TOPO).toFixed(1)}" stroke="#333" stroke-width="1.25" />
    ${marcacoesSvg}
    ${markupConstrutivo}
  </svg>`;
}
