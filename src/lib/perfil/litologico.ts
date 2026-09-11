import { escaparHtml } from "@/lib/escapar-html";
import {
  construirSegmentos,
  alturaTotal,
  gerarMarcacoesRegua,
  profundidadeParaY,
  type Segmento,
} from "./escala";

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

const LARGURA_LABEL = 250;
const MAX_CARACTERES_POR_LINHA = 26;
const LARGURA_COLUNA = 110;
const LARGURA_REGUA = 70;
const PADDING_TOPO = 20;
const PADDING_BASE = 20;
const ALTURA_LINHA_ROTULO = 12;
const ESPACO_ENTRE_ROTULOS = 8;

const defsPatterns = `
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
  segmentos: Segmento[]
): BlocoRotulo[] {
  return camadas.map((camada, indice) => {
    const segmento = segmentos[indice];
    const linhasDescricao = quebrarTexto(
      camada.descricao,
      MAX_CARACTERES_POR_LINHA
    );
    const totalLinhas = linhasDescricao.length + 1; // +1 da linha do intervalo
    return {
      linhasDescricao,
      intervalo: `${camada.profundidadeInicial.toFixed(2)}–${camada.profundidadeFinal.toFixed(2)} m`,
      alturaBloco: totalLinhas * ALTURA_LINHA_ROTULO + ESPACO_ENTRE_ROTULOS,
      centroReal: (segmento.y0 + segmento.y1) / 2,
      fino: segmento.fino,
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

  const blocos = montarBlocosRotulo(camadas, segmentos);
  const posicoes = posicionarRotulos(blocos);
  const alturaRotulos =
    posicoes.length > 0
      ? posicoes[posicoes.length - 1].topo + blocos[blocos.length - 1].alturaBloco
      : 0;

  const xColuna = LARGURA_LABEL;
  const xRegua = xColuna + LARGURA_COLUNA;
  const larguraTotal = LARGURA_LABEL + LARGURA_COLUNA + LARGURA_REGUA;
  const alturaConteudo = Math.max(alturaColuna, alturaRotulos);
  const alturaTotalSvg = alturaConteudo + PADDING_TOPO + PADDING_BASE;

  const retangulos = segmentos
    .map((segmento, indice) => {
      const camada = camadas[indice];
      const padrao = classificarLitologia(camada.descricao);
      const y = segmento.y0 + PADDING_TOPO;
      const h = segmento.y1 - segmento.y0;
      return `<rect x="${xColuna}" y="${y.toFixed(1)}" width="${LARGURA_COLUNA}" height="${h.toFixed(1)}" fill="url(#padrao-${padrao})" stroke="#333" stroke-width="0.75" />`;
    })
    .join("\n");

  const linhasRotulos = blocos
    .map((bloco, indice) => {
      const posicao = posicoes[indice];
      const segmento = segmentos[indice];
      const xTexto = LARGURA_LABEL - 8;

      const linhasTexto = bloco.linhasDescricao
        .map(
          (linha, i) =>
            `<text x="${xTexto}" y="${(posicao.topo + ALTURA_LINHA_ROTULO * (i + 1)).toFixed(1)}" text-anchor="end" font-family="Arial, sans-serif" font-size="10.5" font-weight="600" fill="#1a1a1a">${escaparHtml(linha)}</text>`
        )
        .join("\n");

      const yIntervalo =
        posicao.topo + ALTURA_LINHA_ROTULO * (bloco.linhasDescricao.length + 1);
      const textoIntervalo = `<text x="${xTexto}" y="${yIntervalo.toFixed(1)}" text-anchor="end" font-family="Arial, sans-serif" font-size="9" fill="#666">${bloco.intervalo}</text>`;

      const centroBloco = posicao.topo + bloco.alturaBloco / 2;
      const centroReal = (segmento.y0 + segmento.y1) / 2 + PADDING_TOPO;
      const linhaChamada = posicao.comLinhaDeChamada
        ? `<line x1="${LARGURA_LABEL - 4}" y1="${(centroBloco + PADDING_TOPO).toFixed(1)}" x2="${xColuna}" y2="${centroReal.toFixed(1)}" stroke="#999" stroke-width="0.75" stroke-dasharray="2,2" />`
        : "";

      return `<g transform="translate(0, ${PADDING_TOPO})">${linhasTexto}\n${textoIntervalo}</g>\n${linhaChamada}`;
    })
    .join("\n");

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
    <defs>${defsPatterns}</defs>
    <rect x="0" y="0" width="${larguraTotal}" height="${alturaTotalSvg.toFixed(1)}" fill="#ffffff" />
    ${retangulos}
    <line x1="${xRegua}" y1="${PADDING_TOPO}" x2="${xRegua}" y2="${(alturaColuna + PADDING_TOPO).toFixed(1)}" stroke="#333" stroke-width="1.25" />
    ${marcacoesSvg}
    ${linhasRotulos}
  </svg>`;
}
