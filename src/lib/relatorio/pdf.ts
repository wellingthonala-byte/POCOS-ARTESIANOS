import puppeteer from "puppeteer";
import { buscarDadosRelatorio } from "./dados";
import { renderizarHtmlRelatorio } from "./template";

const estiloCabecalhoRodape = `
  font-family: Arial, Helvetica, sans-serif;
  font-size: 9px;
  color: #555;
  width: 100%;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
`;

export async function gerarRelatorioPdf(pocoId: string): Promise<Buffer | null> {
  const dados = await buscarDadosRelatorio(pocoId);
  if (!dados) return null;

  const html = renderizarHtmlRelatorio(dados);
  const nomeEmpresa = dados.configuracao?.nomeEmpresa ?? "";

  const browser = await puppeteer.launch({
    headless: true,
    // Executar como root em container não permite o sandbox padrão do Chromium.
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      margin: { top: "70px", bottom: "60px", left: "24px", right: "24px" },
      headerTemplate: `
        <div style="${estiloCabecalhoRodape}">
          <span>${nomeEmpresa}</span>
          <span>Poço ${dados.poco.identificacao}</span>
        </div>
      `,
      footerTemplate: `
        <div style="${estiloCabecalhoRodape}; justify-content: center;">
          <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
        </div>
      `,
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
