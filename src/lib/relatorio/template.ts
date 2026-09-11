import type { DadosRelatorio } from "./dados";
import {
  rotulosMetodoObtencaoCoordenada,
  rotulosMetodoPerfuracao,
  rotulosTipoRevestimento,
} from "@/lib/rotulos";
import { escaparHtml } from "@/lib/escapar-html";

// Next.js proíbe importar react-dom/server no grafo de módulos de um Route
// Handler ("renderize como Server Component em vez disso"). Como este HTML
// é para o Puppeteer, não para a árvore de páginas do Next, montamos o
// template com strings simples — e por isso escapamos manualmente todo
// valor que vem de texto digitado pelo usuário (descrição, material, nome
// etc.), já que aqui não há o escape automático do JSX.

function formatarData(data: Date | null | undefined): string {
  if (!data) return "";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(data);
}

function formatarDecimal(
  valor: { toString(): string } | number | null | undefined,
  casas = 2
): string {
  if (valor === null || valor === undefined) return "";
  return Number(valor).toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

function campoDado(rotulo: string, valor: string | null | undefined): string {
  if (!valor) return "";
  return `<div class="campo"><span>${escaparHtml(rotulo)}</span><span>${escaparHtml(valor)}</span></div>`;
}

function renderizarCorpoRelatorio(dados: DadosRelatorio): string {
  const { poco, configuracao } = dados;
  const nomeEmpresa = configuracao?.nomeEmpresa ?? "";
  const testeVazao = poco.testesVazao[0] ?? null;

  const vazaoEspecifica =
    testeVazao?.nivelDinamicoEstabilizado && testeVazao.vazaoEstabilizada
      ? Number(testeVazao.vazaoEstabilizada) /
        (Number(testeVazao.nivelDinamicoEstabilizado) -
          Number(testeVazao.nivelEstatico))
      : null;

  const capa = `
    <section class="capa">
      ${
        configuracao?.logoUrl
          ? `<img src="${escaparHtml(configuracao.logoUrl)}" alt="${escaparHtml(nomeEmpresa)}" />`
          : `<p class="nome-empresa">${escaparHtml(nomeEmpresa)}</p>`
      }
      <h1>Relatório Técnico de Poço Tubular</h1>
      <p class="capa-identificacao">Poço ${escaparHtml(poco.identificacao)}</p>
      <div class="capa-info">
        <p>${escaparHtml(poco.obra.nome)}</p>
        <p>${escaparHtml(poco.obra.cliente.nome)}</p>
        <p>${formatarData(new Date())}</p>
      </div>
    </section>
  `;

  const dadosCadastrais = `
    <section>
      <h2>Dados cadastrais e locação</h2>
      <div class="grade">
        ${campoDado("Identificação", poco.identificacao)}
        ${campoDado("Obra", poco.obra.nome)}
        ${campoDado("Cliente", poco.obra.cliente.nome)}
        ${campoDado("Município/UF", poco.municipio ? `${poco.municipio}/${poco.uf}` : null)}
        ${campoDado("Latitude", formatarDecimal(poco.latitude, 7))}
        ${campoDado("Longitude", formatarDecimal(poco.longitude, 7))}
        ${campoDado(
          "Método de obtenção da coordenada",
          rotulosMetodoObtencaoCoordenada[poco.metodoObtencaoCoordenada]
        )}
      </div>
    </section>
  `;

  const diametrosPorTrecho = poco.revestimentos
    .map(
      (r) =>
        `${escaparHtml(r.diametro)} (${formatarDecimal(r.profundidadeInicial)}–${formatarDecimal(r.profundidadeFinal)} m)`
    )
    .join(", ");

  const dadosPerfuracao = `
    <section>
      <h2>Dados da perfuração</h2>
      <div class="grade">
        ${campoDado("Método", poco.metodoPerfuracao ? rotulosMetodoPerfuracao[poco.metodoPerfuracao] : null)}
        ${campoDado("Data de início", formatarData(poco.dataInicioPerfuracao))}
        ${campoDado("Data de fim", formatarData(poco.dataFimPerfuracao))}
        ${campoDado("Profundidade final", poco.profundidadeFinal ? `${formatarDecimal(poco.profundidadeFinal)} m` : null)}
      </div>
      ${poco.revestimentos.length > 0 ? `<p class="diametros-trecho">Diâmetro(s) de revestimento: ${diametrosPorTrecho}</p>` : ""}
    </section>
  `;

  const litologia =
    poco.camadasLitologicas.length > 0
      ? `
    <section>
      <h2>Perfil litológico</h2>
      <table>
        <thead>
          <tr><th>Profundidade inicial (m)</th><th>Profundidade final (m)</th><th>Descrição</th></tr>
        </thead>
        <tbody>
          ${poco.camadasLitologicas
            .map(
              (camada) => `
            <tr>
              <td>${formatarDecimal(camada.profundidadeInicial)}</td>
              <td>${formatarDecimal(camada.profundidadeFinal)}</td>
              <td>${escaparHtml(camada.descricao)}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </section>`
      : "";

  const temConstrutivo =
    poco.revestimentos.length > 0 ||
    poco.cimentacoes.length > 0 ||
    poco.preFiltros.length > 0;

  const tabelaRevestimento =
    poco.revestimentos.length > 0
      ? `
      <h3>Revestimento</h3>
      <table>
        <thead>
          <tr><th>Prof. inicial (m)</th><th>Prof. final (m)</th><th>Tipo</th><th>Diâmetro</th><th>Material</th></tr>
        </thead>
        <tbody>
          ${poco.revestimentos
            .map(
              (trecho) => `
            <tr>
              <td>${formatarDecimal(trecho.profundidadeInicial)}</td>
              <td>${formatarDecimal(trecho.profundidadeFinal)}</td>
              <td>${rotulosTipoRevestimento[trecho.tipo]}</td>
              <td>${escaparHtml(trecho.diametro)}</td>
              <td>${trecho.material ? escaparHtml(trecho.material) : ""}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>`
      : "";

  const tabelaCimentacao =
    poco.cimentacoes.length > 0
      ? `
      <h3>Cimentação</h3>
      <table>
        <thead><tr><th>Prof. inicial (m)</th><th>Prof. final (m)</th></tr></thead>
        <tbody>
          ${poco.cimentacoes
            .map(
              (trecho) => `
            <tr>
              <td>${formatarDecimal(trecho.profundidadeInicial)}</td>
              <td>${formatarDecimal(trecho.profundidadeFinal)}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>`
      : "";

  const tabelaPreFiltro =
    poco.preFiltros.length > 0
      ? `
      <h3>Pré-filtro</h3>
      <table>
        <thead><tr><th>Prof. inicial (m)</th><th>Prof. final (m)</th><th>Granulometria</th></tr></thead>
        <tbody>
          ${poco.preFiltros
            .map(
              (trecho) => `
            <tr>
              <td>${formatarDecimal(trecho.profundidadeInicial)}</td>
              <td>${formatarDecimal(trecho.profundidadeFinal)}</td>
              <td>${trecho.granulometria ? escaparHtml(trecho.granulometria) : ""}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>`
      : "";

  const construtivo = temConstrutivo
    ? `
    <section>
      <h2>Perfil construtivo</h2>
      ${tabelaRevestimento}
      ${tabelaCimentacao}
      ${tabelaPreFiltro}
    </section>`
    : "";

  const niveisEVazao = testeVazao
    ? `
    <section>
      <h2>Níveis e vazão</h2>
      <div class="grade">
        ${campoDado("Nível estático", `${formatarDecimal(testeVazao.nivelEstatico)} m`)}
        ${campoDado(
          "Nível dinâmico estabilizado",
          testeVazao.nivelDinamicoEstabilizado
            ? `${formatarDecimal(testeVazao.nivelDinamicoEstabilizado)} m`
            : null
        )}
        ${campoDado(
          "Vazão estabilizada",
          testeVazao.vazaoEstabilizada
            ? `${formatarDecimal(testeVazao.vazaoEstabilizada, 3)} m³/h`
            : null
        )}
        ${campoDado(
          "Vazão específica",
          vazaoEspecifica !== null
            ? `${vazaoEspecifica.toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} m³/h/m`
            : null
        )}
      </div>
    </section>`
    : "";

  const assinatura = `
    <section class="assinatura">
      <h2>Responsabilidade técnica</h2>
      <div class="linha-assinatura"></div>
      <p class="assinatura-nome">${poco.responsavelTecnico?.nome ? escaparHtml(poco.responsavelTecnico.nome) : "&nbsp;"}</p>
      <p class="assinatura-detalhe">${
        poco.responsavelTecnico?.crea
          ? `CREA ${escaparHtml(poco.responsavelTecnico.crea)}`
          : "&nbsp;"
      }${poco.numeroArt ? ` — ART ${escaparHtml(poco.numeroArt)}` : ""}</p>
    </section>
  `;

  return [
    capa,
    dadosCadastrais,
    dadosPerfuracao,
    litologia,
    construtivo,
    niveisEVazao,
    assinatura,
  ].join("\n");
}

const estilos = `
  * { box-sizing: border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11px;
    color: #1a1a1a;
    margin: 0;
  }
  h1 { font-size: 22px; margin: 0 0 8px; }
  h2 {
    font-size: 14px;
    margin: 20px 0 8px;
    border-bottom: 2px solid #1a1a1a;
    padding-bottom: 4px;
  }
  h3 { font-size: 12px; margin: 12px 0 6px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; break-inside: avoid; }
  th, td { border: 1px solid #ccc; padding: 4px 8px; text-align: left; font-size: 10px; }
  th { background: #f0f0f0; }
  .grade { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 24px; margin-bottom: 8px; }
  .campo { display: flex; justify-content: space-between; gap: 8px; border-bottom: 1px dotted #ccc; padding: 3px 0; }
  .campo span:first-child { color: #555; }
  .campo span:last-child { font-weight: 600; text-align: right; }
  .diametros-trecho { font-size: 10px; color: #333; }
  .capa {
    break-after: page;
    text-align: center;
    padding-top: 140px;
  }
  .capa img { max-height: 90px; margin-bottom: 24px; }
  .capa .nome-empresa { font-size: 16px; font-weight: 700; margin-bottom: 40px; }
  .capa-identificacao { font-size: 18px; font-weight: 600; margin-top: 16px; }
  .capa-info { margin-top: 24px; color: #444; }
  .capa-info p { margin: 4px 0; }
  .assinatura { margin-top: 60px; break-inside: avoid; text-align: center; }
  .linha-assinatura { border-top: 1px solid #000; width: 320px; margin: 60px auto 8px; }
  .assinatura-nome { font-weight: 600; margin: 0; }
  .assinatura-detalhe { color: #555; margin: 2px 0 0; }
`;

export function renderizarHtmlRelatorio(dados: DadosRelatorio): string {
  const corpo = renderizarCorpoRelatorio(dados);
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Relatório do poço ${escaparHtml(dados.poco.identificacao)}</title>
<style>${estilos}</style>
</head>
<body>${corpo}</body>
</html>`;
}
