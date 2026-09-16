import type { DadosRelatorio } from "./dados";
import {
  rotulosMetodoObtencaoCoordenada,
  rotulosMetodoPerfuracao,
  rotulosTipoRevestimento,
  rotulosTipoAnexo,
  rotulosTipoTesteVazao,
} from "@/lib/rotulos";
import { escaparHtml } from "@/lib/escapar-html";
import { gerarSvgPerfilPoco } from "@/lib/perfil/perfil";
import { calcularEscalaAutomatica } from "@/lib/perfil/escala";
import { mapearDadosParaPerfil, temDadosDePerfil } from "@/lib/perfil/mapear-dados";
import { lerAnexoComoDataUri } from "@/lib/anexos/armazenamento";
import { gerarSvgGraficoLinha } from "@/lib/graficos/grafico-linha";

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

// Na tela, o SVG usa largura/altura fixas em pixel (o usuário ajusta a
// escala e rola horizontalmente se precisar). No PDF não há rolagem — o
// desenho precisa caber na largura da página, então troca-se para
// width="100%"/height="auto" no <svg> raiz (mantendo o viewBox original)
// para escalar proporcionalmente à largura impressa, por maior que seja a
// profundidade do poço.
function tornarSvgResponsivo(svg: string): string {
  return svg.replace(
    /^(<svg[^>]*?)\swidth="[^"]*"\sheight="[^"]*"/,
    '$1 width="100%" height="auto"'
  );
}

async function renderizarCorpoRelatorio(dados: DadosRelatorio): Promise<string> {
  const { poco, configuracao } = dados;
  const nomeEmpresa = configuracao?.nomeEmpresa ?? "";
  const testeVazao = poco.testesVazao[0] ?? null;

  const vazaoEspecifica =
    testeVazao?.nivelDinamicoEstabilizado && testeVazao.vazaoEstabilizada
      ? Number(testeVazao.vazaoEstabilizada) /
        (Number(testeVazao.nivelDinamicoEstabilizado) -
          Number(testeVazao.nivelEstatico))
      : null;

  // CNPJ/endereço/telefone/email são cadastrados em /configuracoes
  // justamente pra aparecer no relatório — mostrar só o nome da empresa
  // deixava esse cadastro sem efeito nenhum no documento final.
  const contatoEmpresa = [configuracao?.endereco, configuracao?.telefone, configuracao?.email]
    .filter((valor): valor is string => Boolean(valor))
    .map((valor) => escaparHtml(valor))
    .join(" · ");

  const capa = `
    <section class="capa">
      <div class="capa-cabecalho">
        ${
          configuracao?.logoUrl
            ? `<img src="${escaparHtml(configuracao.logoUrl)}" alt="${escaparHtml(nomeEmpresa)}" />`
            : `<p class="nome-empresa">${escaparHtml(nomeEmpresa)}</p>`
        }
        ${configuracao?.cnpj ? `<p class="capa-cnpj">CNPJ ${escaparHtml(configuracao.cnpj)}</p>` : ""}
        ${contatoEmpresa ? `<p class="capa-contato">${contatoEmpresa}</p>` : ""}
      </div>
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

  const dadosPerfil = mapearDadosParaPerfil(poco);
  const desenhoPerfil = temDadosDePerfil(dadosPerfil)
    ? `
    <section class="perfil">
      <h2>Desenho do perfil</h2>
      ${tornarSvgResponsivo(
        gerarSvgPerfilPoco({
          ...dadosPerfil,
          pixelsPorMetro: calcularEscalaAutomatica(dadosPerfil.profundidadeTotal),
        })
      )}
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

  // Detalhe do teste de vazão (leitura por leitura + gráficos), separado
  // do resumo acima — mesma separação que já existe na tela (etapa 5 vs.
  // /teste-vazao completo). Reaproveita gerarSvgGraficoLinha, a mesma
  // função usada na tela (Fase 6), com os mesmos critérios de quando
  // mostrar cada gráfico: rebaixamento×tempo sempre que houver leitura,
  // vazão×rebaixamento só se alguma leitura tiver vazão lançada.
  const leituras = testeVazao?.leituras ?? [];
  const testeVazaoDetalhado =
    testeVazao && leituras.length > 0
      ? (() => {
          const nivelEstaticoNum = Number(testeVazao.nivelEstatico);
          const leiturasComVazao = leituras.filter((l) => l.vazao !== null);

          const graficoRebaixamento = gerarSvgGraficoLinha(
            leituras.map((l) => ({
              x: Number(l.tempoMinutos),
              y: Number(l.nivelDinamico) - nivelEstaticoNum,
            })),
            { rotuloEixoX: "Tempo (min)", rotuloEixoY: "Rebaixamento (m)" }
          );
          const graficoVazao =
            leiturasComVazao.length > 0
              ? gerarSvgGraficoLinha(
                  leiturasComVazao.map((l) => ({
                    x: Number(l.nivelDinamico) - nivelEstaticoNum,
                    y: Number(l.vazao),
                  })),
                  {
                    rotuloEixoX: "Rebaixamento (m)",
                    rotuloEixoY: "Vazão (m³/h)",
                    cor: "#d9691d",
                  }
                )
              : "";

          return `
    <section class="teste-vazao">
      <h2>Teste de vazão — ${escaparHtml(rotulosTipoTesteVazao[testeVazao.tipo] ?? testeVazao.tipo)}</h2>
      <table>
        <thead>
          <tr><th>Tempo (min)</th><th>Nível dinâmico (m)</th><th>Rebaixamento (m)</th><th>Vazão (m³/h)</th></tr>
        </thead>
        <tbody>
          ${leituras
            .map(
              (l) => `
            <tr>
              <td>${formatarDecimal(l.tempoMinutos)}</td>
              <td>${formatarDecimal(l.nivelDinamico)}</td>
              <td>${formatarDecimal(Number(l.nivelDinamico) - nivelEstaticoNum)}</td>
              <td>${l.vazao !== null ? formatarDecimal(l.vazao, 3) : "—"}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
      <div class="grade-graficos">
        <div>${graficoRebaixamento}</div>
        ${graficoVazao ? `<div>${graficoVazao}</div>` : ""}
      </div>
    </section>`;
        })()
      : "";

  // Cada análise é sua própria subseção (data + laboratório + tabela de
  // parâmetro) — "fora do padrão" repete a mesma comparação simples da
  // tela (lista-parametros.tsx): não dá pra fazer isso em SQL (Prisma não
  // compara duas colunas da mesma linha num where), então é feito aqui
  // depois de já ter buscado tudo, igual lá.
  const analiseAgua =
    poco.analisesAgua.length > 0
      ? `
    <section class="analise-agua">
      <h2>Análise de água</h2>
      ${poco.analisesAgua
        .map((analise) => {
          const foraDoPadrao = (p: (typeof analise.parametros)[number]) => {
            const valor = Number(p.valor);
            if (p.vmpMinimo !== null && valor < Number(p.vmpMinimo)) return true;
            if (p.vmpMaximo !== null && valor > Number(p.vmpMaximo)) return true;
            return false;
          };
          return `
      <h3>
        Coleta em ${formatarData(analise.dataColeta)}${analise.laboratorio ? ` — ${escaparHtml(analise.laboratorio)}` : ""}
      </h3>
      ${
        analise.parametros.length > 0
          ? `
      <table>
        <thead>
          <tr><th>Parâmetro</th><th>Valor</th><th>Unidade</th><th>VMP</th></tr>
        </thead>
        <tbody>
          ${analise.parametros
            .map((p) => {
              const vmp =
                p.vmpMinimo !== null || p.vmpMaximo !== null
                  ? `${p.vmpMinimo !== null ? formatarDecimal(p.vmpMinimo) : "—"} a ${p.vmpMaximo !== null ? formatarDecimal(p.vmpMaximo) : "—"}`
                  : "—";
              const foraClasse = foraDoPadrao(p) ? ' class="fora-do-padrao"' : "";
              return `
            <tr${foraClasse}>
              <td>${escaparHtml(p.nome)}</td>
              <td>${formatarDecimal(p.valor)}</td>
              <td>${escaparHtml(p.unidade)}</td>
              <td>${vmp}</td>
            </tr>`;
            })
            .join("")}
        </tbody>
      </table>`
          : `<p class="diametros-trecho">Nenhum parâmetro lançado nesta coleta.</p>`
      }`;
        })
        .join("")}
    </section>`
      : "";

  // Croqui/ART/laudo (diferente de foto) existem pra documentar, não pra
  // ilustrar — por isso viram uma lista de conferência (nome + legenda),
  // com miniatura só quando o arquivo enviado for imagem (comum: técnico
  // fotografa o papel em vez de anexar o PDF original). PDF anexado não é
  // embutido — precisaria de uma lib de manipulação de PDF só pra isso, e
  // o ganho não compensa; o nome do arquivo já entra na lista de conferência.
  const ehImagemAnexo = (nomeArquivo: string) => /\.(jpe?g|png|webp|heic|heif)$/i.test(nomeArquivo);
  const documentosParaRelatorio = poco.anexos.filter((anexo) => anexo.tipo !== "foto");
  const itensDocumentos = (
    await Promise.all(
      documentosParaRelatorio.map(async (anexo) => {
        const rotuloTipo = escaparHtml(rotulosTipoAnexo[anexo.tipo] ?? anexo.tipo);
        const legenda = anexo.legenda ? escaparHtml(anexo.legenda) : "";
        const dataUri = ehImagemAnexo(anexo.nomeArquivo)
          ? await lerAnexoComoDataUri(anexo.pocoId, anexo.id, anexo.nomeArquivo)
          : null;
        return `
          <li>
            ${dataUri ? `<img src="${dataUri}" alt="${rotuloTipo}" />` : ""}
            <span><strong>${rotuloTipo}</strong> — ${escaparHtml(anexo.nomeArquivo)}${legenda ? ` (${legenda})` : ""}</span>
          </li>`;
      })
    )
  ).join("");
  const documentosAnexados = itensDocumentos
    ? `
    <section class="documentos">
      <h2>Documentos anexados</h2>
      <p class="diametros-trecho">Lista de conferência — anexar junto ao protocolo os arquivos originais listados abaixo.</p>
      <ul class="lista-documentos">${itensDocumentos}</ul>
    </section>`
    : "";

  // Só fotos (não ART/croqui/laudo) marcadas com incluirNoRelatorio entram
  // aqui — os outros tipos de anexo existem só pra guardar/consultar
  // documento, não pra ilustrar o relatório impresso.
  const fotosParaRelatorio = poco.anexos.filter(
    (anexo) => anexo.tipo === "foto" && anexo.incluirNoRelatorio
  );
  const figurasFotos = (
    await Promise.all(
      fotosParaRelatorio.map(async (anexo) => {
        const dataUri = await lerAnexoComoDataUri(anexo.pocoId, anexo.id, anexo.nomeArquivo);
        if (!dataUri) return "";
        const legenda = anexo.legenda ? escaparHtml(anexo.legenda) : "";
        return `
          <figure>
            <img src="${dataUri}" alt="${legenda || escaparHtml(anexo.nomeArquivo)}" />
            ${legenda ? `<figcaption>${legenda}</figcaption>` : ""}
          </figure>`;
      })
    )
  ).join("");
  const fotos = figurasFotos
    ? `
    <section class="fotos">
      <h2>Fotos</h2>
      <div class="grade-fotos">${figurasFotos}</div>
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
    desenhoPerfil,
    litologia,
    construtivo,
    niveisEVazao,
    testeVazaoDetalhado,
    analiseAgua,
    fotos,
    documentosAnexados,
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
  .perfil { break-before: page; }
  .perfil svg { display: block; margin: 0 auto; }
  .capa {
    break-after: page;
    text-align: center;
    padding-top: 140px;
  }
  .capa img { max-height: 90px; margin-bottom: 24px; }
  .capa-cabecalho { margin-bottom: 40px; }
  .capa .nome-empresa { font-size: 16px; font-weight: 700; margin: 0 0 4px; }
  .capa-cnpj { font-size: 10px; color: #555; margin: 0 0 2px; }
  .capa-contato { font-size: 10px; color: #555; margin: 0; }
  .capa-identificacao { font-size: 18px; font-weight: 600; margin-top: 16px; }
  .capa-info { margin-top: 24px; color: #444; }
  .capa-info p { margin: 4px 0; }
  .grade-fotos { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .grade-fotos figure { margin: 0; break-inside: avoid; }
  .grade-fotos img { width: 100%; max-height: 260px; object-fit: cover; border: 1px solid #ccc; border-radius: 4px; }
  .grade-fotos figcaption { font-size: 10px; color: #555; margin-top: 4px; text-align: center; }
  .teste-vazao { break-before: page; }
  .grade-graficos { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 8px; }
  .grade-graficos svg { display: block; width: 100%; height: auto; }
  .analise-agua { break-before: page; }
  .fora-do-padrao { background: #fbe4e4; font-weight: 700; color: #8a1f1f; }
  .documentos { break-inside: avoid; }
  .lista-documentos { list-style: none; margin: 0; padding: 0; }
  .lista-documentos li { display: flex; align-items: center; gap: 10px; padding: 6px 0; border-bottom: 1px dotted #ccc; break-inside: avoid; }
  .lista-documentos img { width: 60px; height: 60px; object-fit: cover; border: 1px solid #ccc; border-radius: 4px; flex-shrink: 0; }
  .assinatura { margin-top: 60px; break-inside: avoid; text-align: center; }
  .linha-assinatura { border-top: 1px solid #000; width: 320px; margin: 60px auto 8px; }
  .assinatura-nome { font-weight: 600; margin: 0; }
  .assinatura-detalhe { color: #555; margin: 2px 0 0; }
`;

export async function renderizarHtmlRelatorio(dados: DadosRelatorio): Promise<string> {
  const corpo = await renderizarCorpoRelatorio(dados);
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
