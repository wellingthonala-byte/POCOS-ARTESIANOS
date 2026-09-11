import { escaparHtml } from "@/lib/escapar-html";
import {
  construirSegmentos,
  alturaTotal,
  gerarMarcacoesRegua,
  profundidadeParaY,
  type Segmento,
} from "./escala";

type PosicaoCamada = { y0: number; y1: number; fino: boolean };

function posicionarCamadas(
  camadas: CamadaPerfil[],
  segmentos: Segmento[],
  profundidadeTotal: number
): PosicaoCamada[] {
  const limiarFino = profundidadeTotal * 0.01;
  return camadas.map((camada) => ({
    y0: profundidadeParaY(segmentos, camada.profundidadeInicial),
    y1: profundidadeParaY(segmentos, camada.profundidadeFinal),
    fino: camada.profundidadeFinal - camada.profundidadeInicial < limiarFino,
  }));
}

export type CamadaPerfil = {
  id: string;
  ordem: number;
  profundidadeInicial: number;
  profundidadeFinal: number;
  descricao: string;
};

type TipoPadrao = "areia" | "argila" | "rocha" | "cascalho" | "outro";

// Heurística por palavra-chave: a descrição da camada é texto livre (com
// sugestões pré-cadastradas, mas sem um campo de "tipo" estruturado), então
// classificamos por palavras-chave para escolher a hachura do desenho.
function classificarLitologia(descricao: string): TipoPadrao {
  const texto = descricao.toLowerCase();
  if (
    /(granito|gnaisse|basalto|calc[aá]rio|quartzito|arenito|laterita|saprolito|\brocha\b)/.test(
      texto
    )
  ) {
    return "rocha";
  }
  if (/argil/.test(texto)) return "argila";
  if (/silte/.test(texto)) return "argila";
  if (/(areia|arenos)/.test(texto)) return "areia";
  if (/(cascalho|seixo)/.test(texto)) return "cascalho";
  return "outro";
}

// Sem medição real de texto disponível (isto roda tanto no navegador quanto
// no servidor, sem canvas), quebramos por número de caracteres — conservador
// o bastante para caber na largura reservada mesmo em fonte em negrito.
function quebrarTexto(texto: string, maxCaracteresPorLinha: number): string[] {
  const palavras = texto.split(" ");
  const linhas: string[] = [];
  let linhaAtual = "";

  for (const palavra of palavras) {
    const candidata = linhaAtual ? `${linhaAtual} ${palavra}` : palavra;
    if (candidata.length > maxCaracteresPorLinha && linhaAtual) {
      linhas.push(linhaAtual);
      linhaAtual = palavra;
    } else {
      linhaAtual = candidata;
    }
  }
  if (linhaAtual) linhas.push(linhaAtual);

  return linhas;
}

export const LARGURA_LABEL_LITOLOGICO = 250;
const MAX_CARACTERES_POR_LINHA = 26;
export const LARGURA_COLUNA_LITOLOGICO = 110;
const ALTURA_LINHA_ROTULO = 12;
const ESPACO_ENTRE_ROTULOS = 8;

export const defsPatternsLitologicos = `
  <pattern id="padrao-areia" width="8" height="8" patternUnits="userSpaceOnUse">
    <rect width="8" height="8" fill="#f5e8c8"/>
    <circle cx="2" cy="2" r="0.9" fill="#b8935a"/>
    <circle cx="6" cy="6" r="0.9" fill="#b8935a"/>
  </pattern>
  <pattern id="padrao-argila" width="12" height="8" patternUnits="userSpaceOnUse">
    <rect width="12" height="8" fill="#ddc9a3"/>
    <line x1="0" y1="4" x2="12" y2="4" stroke="#7a6440" stroke-width="0.9"/>
  </pattern>
  <pattern id="padrao-rocha" width="10" height="10" patternUnits="userSpaceOnUse">
    <rect width="10" height="10" fill="#d8d8d8"/>
    <line x1="0" y1="0" x2="10" y2="10" stroke="#7a7a7a" stroke-width="0.8"/>
    <line x1="10" y1="0" x2="0" y2="10" stroke="#7a7a7a" stroke-width="0.8"/>
  </pattern>
  <pattern id="padrao-cascalho" width="14" height="14" patternUnits="userSpaceOnUse">
    <rect width="14" height="14" fill="#e2d6bb"/>
    <circle cx="3" cy="4" r="1.8" fill="#96794a"/>
    <circle cx="10" cy="10" r="2.1" fill="#96794a"/>
  </pattern>
  <pattern id="padrao-outro" width="10" height="10" patternUnits="userSpaceOnUse">
    <rect width="10" height="10" fill="#eaeaea"/>
  </pattern>
`;

type BlocoRotulo = {
  linhasDescricao: string[];
  intervalo: string;
  alturaBloco: number;
  centroReal: number;
  fino: boolean;
};

function montarBlocosRotulo(
  camadas: CamadaPerfil[],
  posicoes: PosicaoCamada[]
): BlocoRotulo[] {
  return camadas.map((camada, indice) => {
    const posicao = posicoes[indice];
    const linhasDescricao = quebrarTexto(
      camada.descricao,
      MAX_CARACTERES_POR_LINHA
    );
    const totalLinhas = linhasDescricao.length + 1; // +1 da linha do intervalo
    return {
      linhasDescricao,
      intervalo: `${camada.profundidadeInicial.toFixed(2)}–${camada.profundidadeFinal.toFixed(2)} m`,
      alturaBloco: totalLinhas * ALTURA_LINHA_ROTULO + ESPACO_ENTRE_ROTULOS,
      centroReal: (posicao.y0 + posicao.y1) / 2,
      fino: posicao.fino,
    };
  });
}

// Posiciona o topo de cada bloco de rótulo tentando centralizar no meio real
// da camada, mas nunca sobrepondo o bloco anterior — blocos empurrados (ou
// de camadas finas) ganham linha de chamada até o retângulo.
function posicionarRotulos(
  blocos: BlocoRotulo[]
): { topo: number; comLinhaDeChamada: boolean }[] {
  const resultado: { topo: number; comLinhaDeChamada: boolean }[] = [];
  let proximoTopoMinimo = -Infinity;

  blocos.forEach((bloco) => {
    const topoDesejado = bloco.centroReal - bloco.alturaBloco / 2;
    const topo = Math.max(topoDesejado, proximoTopoMinimo);
    proximoTopoMinimo = topo + bloco.alturaBloco;
    const centroFinal = topo + bloco.alturaBloco / 2;
    resultado.push({
      topo,
      comLinhaDeChamada: bloco.fino || Math.abs(centroFinal - bloco.centroReal) > 1,
    });
  });

  return resultado;
}

/**
 * Gera os retângulos e rótulos da coluna litológica usando uma escala já
 * calculada externamente (compartilhada com a coluna construtiva). Não
 * inclui `<svg>`/`<defs>` — quem chama monta o desenho completo.
 */
export function gerarMarkupColunaLitologica(
  camadas: CamadaPerfil[],
  segmentos: Segmento[],
  opcoes: {
    xColuna: number;
    larguraLabel: number;
    paddingTopo: number;
    profundidadeTotal: number;
  }
): { markup: string; alturaRotulos: number } {
  const { xColuna, larguraLabel, paddingTopo, profundidadeTotal } = opcoes;
  const posicoesCamadas = posicionarCamadas(camadas, segmentos, profundidadeTotal);

  const retangulos = camadas
    .map((camada, indice) => {
      const posicao = posicoesCamadas[indice];
      const padrao = classificarLitologia(camada.descricao);
      const y = posicao.y0 + paddingTopo;
      const h = posicao.y1 - posicao.y0;
      return `<rect x="${xColuna}" y="${y.toFixed(1)}" width="${LARGURA_COLUNA_LITOLOGICO}" height="${h.toFixed(1)}" fill="url(#padrao-${padrao})" stroke="#333" stroke-width="0.75" />`;
    })
    .join("\n");

  const blocos = montarBlocosRotulo(camadas, posicoesCamadas);
  const posicoesRotulos = posicionarRotulos(blocos);
  const alturaRotulos =
    posicoesRotulos.length > 0
      ? posicoesRotulos[posicoesRotulos.length - 1].topo +
        blocos[blocos.length - 1].alturaBloco
      : 0;

  const linhasRotulos = blocos
    .map((bloco, indice) => {
      const posicaoRotulo = posicoesRotulos[indice];
      const posicaoCamada = posicoesCamadas[indice];
      const xTexto = larguraLabel - 8;

      const linhasTexto = bloco.linhasDescricao
        .map(
          (linha, i) =>
            `<text x="${xTexto}" y="${(posicaoRotulo.topo + ALTURA_LINHA_ROTULO * (i + 1)).toFixed(1)}" text-anchor="end" font-family="Arial, sans-serif" font-size="10.5" font-weight="600" fill="#1a1a1a">${escaparHtml(linha)}</text>`
        )
        .join("\n");

      const yIntervalo =
        posicaoRotulo.topo + ALTURA_LINHA_ROTULO * (bloco.linhasDescricao.length + 1);
      const textoIntervalo = `<text x="${xTexto}" y="${yIntervalo.toFixed(1)}" text-anchor="end" font-family="Arial, sans-serif" font-size="9" fill="#666">${bloco.intervalo}</text>`;

      const centroBloco = posicaoRotulo.topo + bloco.alturaBloco / 2;
      const centroReal = (posicaoCamada.y0 + posicaoCamada.y1) / 2 + paddingTopo;
      const linhaChamada = posicaoRotulo.comLinhaDeChamada
        ? `<line x1="${larguraLabel - 4}" y1="${(centroBloco + paddingTopo).toFixed(1)}" x2="${xColuna}" y2="${centroReal.toFixed(1)}" stroke="#999" stroke-width="0.75" stroke-dasharray="2,2" />`
        : "";

      return `<g transform="translate(0, ${paddingTopo})">${linhasTexto}\n${textoIntervalo}</g>\n${linhaChamada}`;
    })
    .join("\n");

  return { markup: `${retangulos}\n${linhasRotulos}`, alturaRotulos };
}

const LARGURA_REGUA = 70;
const PADDING_TOPO = 20;
const PADDING_BASE = 20;

/** Uso isolado (sem coluna construtiva) — mantém a escala própria a partir só das camadas. */
export function gerarSvgPerfilLitologico(
  camadas: CamadaPerfil[],
  opcoes: { profundidadeTotal: number; pixelsPorMetro: number }
): string {
  const { profundidadeTotal, pixelsPorMetro } = opcoes;

  if (camadas.length === 0 || profundidadeTotal <= 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60">
      <text x="10" y="30" font-family="Arial, sans-serif" font-size="12" fill="#666">
        Sem camadas lançadas.
      </text>
    </svg>`;
  }

  const segmentos = construirSegmentos(camadas, profundidadeTotal, pixelsPorMetro);
  const alturaColuna = alturaTotal(segmentos);
  const marcacoesRegua = gerarMarcacoesRegua(profundidadeTotal);

  const xColuna = LARGURA_LABEL_LITOLOGICO;
  const xRegua = xColuna + LARGURA_COLUNA_LITOLOGICO;
  const larguraTotal = LARGURA_LABEL_LITOLOGICO + LARGURA_COLUNA_LITOLOGICO + LARGURA_REGUA;

  const { markup, alturaRotulos } = gerarMarkupColunaLitologica(camadas, segmentos, {
    xColuna,
    larguraLabel: LARGURA_LABEL_LITOLOGICO,
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

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${larguraTotal}" height="${alturaTotalSvg.toFixed(1)}" viewBox="0 0 ${larguraTotal} ${alturaTotalSvg.toFixed(1)}">
    <defs>${defsPatternsLitologicos}</defs>
    <rect x="0" y="0" width="${larguraTotal}" height="${alturaTotalSvg.toFixed(1)}" fill="#ffffff" />
    ${markup}
    <line x1="${xRegua}" y1="${PADDING_TOPO}" x2="${xRegua}" y2="${(alturaColuna + PADDING_TOPO).toFixed(1)}" stroke="#333" stroke-width="1.25" />
    ${marcacoesSvg}
  </svg>`;
}
