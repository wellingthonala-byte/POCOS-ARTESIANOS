import { escaparHtml } from "@/lib/escapar-html";

// Gráfico de linha simples (Fase 6) gerado como string SVG — mesmo motivo
// do desenho do perfil (Fase 4): sem JSX/React aqui evita esbarrar na
// restrição do Next.js contra `react-dom/server` caso este SVG precise
// entrar num Route Handler no futuro (ex.: embutido no relatório), e evita
// puxar uma biblioteca de gráficos só para um punhado de pontos.

export type PontoGrafico = { x: number; y: number };

const LARGURA_PADRAO = 340;
const ALTURA_PADRAO = 220;
const MARGEM = { topo: 16, direita: 16, baixo: 36, esquerda: 48 };
const NUM_MARCACOES = 4;

function calcularEscala(
  valores: number[],
  tamanhoDisponivel: number
): { minimo: number; maximo: number; converter: (v: number) => number } {
  const minimoReal = Math.min(...valores);
  const maximoReal = Math.max(...valores);
  // Intervalo de valor único (ex.: uma leitura só): abre uma folga
  // artificial pra não dividir por zero e o ponto não ficar colado na borda.
  const folga = maximoReal - minimoReal || Math.abs(maximoReal) * 0.1 || 1;
  const minimo = minimoReal - folga * 0.1;
  const maximo = maximoReal + folga * 0.1;
  return {
    minimo,
    maximo,
    converter: (v: number) => ((v - minimo) / (maximo - minimo)) * tamanhoDisponivel,
  };
}

function gerarMarcacoes(minimo: number, maximo: number): number[] {
  const marcacoes: number[] = [];
  for (let i = 0; i <= NUM_MARCACOES; i++) {
    marcacoes.push(minimo + ((maximo - minimo) * i) / NUM_MARCACOES);
  }
  return marcacoes;
}

function formatarNumero(valor: number): string {
  return valor.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

/**
 * Gera um SVG de linha (com pontos marcados) a partir de uma lista de
 * pontos XY. Não inclui zero forçado nos eixos — a escala se ajusta aos
 * dados, como um gráfico de dispersão comum (não é papel semilog de
 * hidrogeologia).
 */
export function gerarSvgGraficoLinha(
  pontos: PontoGrafico[],
  opcoes: {
    rotuloEixoX: string;
    rotuloEixoY: string;
    largura?: number;
    altura?: number;
    cor?: string;
  }
): string {
  const { rotuloEixoX, rotuloEixoY, cor = "#1c3f5f" } = opcoes;
  const largura = opcoes.largura ?? LARGURA_PADRAO;
  const altura = opcoes.altura ?? ALTURA_PADRAO;

  if (pontos.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${largura}" height="${altura}">
      <text x="${largura / 2}" y="${altura / 2}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#666">
        Sem leituras lançadas ainda.
      </text>
    </svg>`;
  }

  const larguraGrafico = largura - MARGEM.esquerda - MARGEM.direita;
  const alturaGrafico = altura - MARGEM.topo - MARGEM.baixo;

  const escalaX = calcularEscala(
    pontos.map((p) => p.x),
    larguraGrafico
  );
  const escalaY = calcularEscala(
    pontos.map((p) => p.y),
    alturaGrafico
  );

  const paraSvgX = (x: number) => MARGEM.esquerda + escalaX.converter(x);
  // Y da tela cresce pra baixo; valor do gráfico cresce pra cima.
  const paraSvgY = (y: number) => MARGEM.topo + (alturaGrafico - escalaY.converter(y));

  const pontosOrdenados = [...pontos].sort((a, b) => a.x - b.x);
  const linha = pontosOrdenados
    .map((p) => `${paraSvgX(p.x).toFixed(1)},${paraSvgY(p.y).toFixed(1)}`)
    .join(" ");
  const circulos = pontosOrdenados
    .map(
      (p) =>
        `<circle cx="${paraSvgX(p.x).toFixed(1)}" cy="${paraSvgY(p.y).toFixed(1)}" r="3.5" fill="${cor}" />`
    )
    .join("\n");

  const marcacoesX = gerarMarcacoes(escalaX.minimo, escalaX.maximo)
    .map((valor) => {
      const x = paraSvgX(valor);
      return `
        <line x1="${x.toFixed(1)}" y1="${MARGEM.topo}" x2="${x.toFixed(1)}" y2="${(altura - MARGEM.baixo).toFixed(1)}" stroke="#e2dbc7" stroke-width="1" />
        <text x="${x.toFixed(1)}" y="${(altura - MARGEM.baixo + 16).toFixed(1)}" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="#83745a">${formatarNumero(valor)}</text>
      `;
    })
    .join("\n");

  const marcacoesY = gerarMarcacoes(escalaY.minimo, escalaY.maximo)
    .map((valor) => {
      const y = paraSvgY(valor);
      return `
        <line x1="${MARGEM.esquerda}" y1="${y.toFixed(1)}" x2="${(largura - MARGEM.direita).toFixed(1)}" y2="${y.toFixed(1)}" stroke="#e2dbc7" stroke-width="1" />
        <text x="${(MARGEM.esquerda - 6).toFixed(1)}" y="${(y + 3).toFixed(1)}" text-anchor="end" font-family="Arial, sans-serif" font-size="9" fill="#83745a">${formatarNumero(valor)}</text>
      `;
    })
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${largura}" height="${altura}" viewBox="0 0 ${largura} ${altura}">
    <rect x="0" y="0" width="${largura}" height="${altura}" fill="#ffffff" />
    ${marcacoesY}
    ${marcacoesX}
    <line x1="${MARGEM.esquerda}" y1="${MARGEM.topo}" x2="${MARGEM.esquerda}" y2="${(altura - MARGEM.baixo).toFixed(1)}" stroke="#302a1f" stroke-width="1.25" />
    <line x1="${MARGEM.esquerda}" y1="${(altura - MARGEM.baixo).toFixed(1)}" x2="${(largura - MARGEM.direita).toFixed(1)}" y2="${(altura - MARGEM.baixo).toFixed(1)}" stroke="#302a1f" stroke-width="1.25" />
    <polyline points="${linha}" fill="none" stroke="${cor}" stroke-width="1.75" />
    ${circulos}
    <text x="${(largura / 2).toFixed(1)}" y="${(altura - 4).toFixed(1)}" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#302a1f">${escaparHtml(rotuloEixoX)}</text>
    <text x="12" y="${(altura / 2).toFixed(1)}" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#302a1f" transform="rotate(-90, 12, ${(altura / 2).toFixed(1)})">${escaparHtml(rotuloEixoY)}</text>
  </svg>`;
}
