import ExcelJS from "exceljs";
import { buscarDadosRelatorio } from "./dados";
import {
  rotulosStatusPoco,
  rotulosMetodoObtencaoCoordenada,
  rotulosMetodoPerfuracao,
  rotulosTipoRevestimento,
  rotulosTipoTesteVazao,
} from "@/lib/rotulos";

function numero(valor: { toNumber(): number } | null | undefined): number | null {
  return valor ? valor.toNumber() : null;
}

function data(valor: Date | null | undefined): Date | null {
  return valor ?? null;
}

export async function gerarRelatorioExcel(pocoId: string): Promise<Buffer | null> {
  const dados = await buscarDadosRelatorio(pocoId);
  if (!dados) return null;

  const { poco } = dados;
  const workbook = new ExcelJS.Workbook();

  // -------------------------------------------------------------------
  // Aba 1 — Dados Gerais
  // -------------------------------------------------------------------
  const abaGerais = workbook.addWorksheet("Dados Gerais");
  abaGerais.columns = [
    { header: "Campo", key: "campo", width: 32 },
    { header: "Valor", key: "valor", width: 40 },
  ];
  function adicionarCampoGerais(
    campo: string,
    valor: string | number | Date | null,
    numFmt?: string
  ) {
    const linha = abaGerais.addRow({ campo, valor });
    if (numFmt) linha.getCell("valor").numFmt = numFmt;
  }

  adicionarCampoGerais("Identificação", poco.identificacao);
  adicionarCampoGerais("Status", rotulosStatusPoco[poco.status]);
  adicionarCampoGerais("Obra", poco.obra.nome);
  adicionarCampoGerais("Cliente", poco.obra.cliente.nome);
  adicionarCampoGerais("Município", poco.municipio);
  adicionarCampoGerais("UF", poco.uf);
  adicionarCampoGerais("Latitude", numero(poco.latitude));
  adicionarCampoGerais("Longitude", numero(poco.longitude));
  adicionarCampoGerais(
    "Método de obtenção da coordenada",
    rotulosMetodoObtencaoCoordenada[poco.metodoObtencaoCoordenada]
  );
  adicionarCampoGerais(
    "Método de perfuração",
    poco.metodoPerfuracao ? rotulosMetodoPerfuracao[poco.metodoPerfuracao] : null
  );
  adicionarCampoGerais(
    "Data de início da perfuração",
    data(poco.dataInicioPerfuracao),
    "dd/mm/yyyy"
  );
  adicionarCampoGerais(
    "Data de fim da perfuração",
    data(poco.dataFimPerfuracao),
    "dd/mm/yyyy"
  );
  adicionarCampoGerais("Profundidade final (m)", numero(poco.profundidadeFinal));
  adicionarCampoGerais("Número da ART", poco.numeroArt);
  adicionarCampoGerais("Responsável técnico", poco.responsavelTecnico?.nome ?? null);
  adicionarCampoGerais(
    "CREA do responsável técnico",
    poco.responsavelTecnico?.crea ?? null
  );
  abaGerais.getRow(1).font = { bold: true };

  // -------------------------------------------------------------------
  // Aba 2 — Litologia
  // -------------------------------------------------------------------
  const abaLitologia = workbook.addWorksheet("Litologia");
  abaLitologia.columns = [
    { header: "Ordem", key: "ordem", width: 8 },
    { header: "Profundidade inicial (m)", key: "inicial", width: 20 },
    { header: "Profundidade final (m)", key: "final", width: 20 },
    { header: "Descrição", key: "descricao", width: 40 },
  ];
  poco.camadasLitologicas.forEach((camada) => {
    abaLitologia.addRow({
      ordem: camada.ordem,
      inicial: numero(camada.profundidadeInicial),
      final: numero(camada.profundidadeFinal),
      descricao: camada.descricao,
    });
  });
  abaLitologia.getRow(1).font = { bold: true };

  // -------------------------------------------------------------------
  // Aba 3 — Construtivo (revestimento, cimentação, pré-filtro)
  // -------------------------------------------------------------------
  const abaConstrutivo = workbook.addWorksheet("Construtivo");
  abaConstrutivo.getColumn(1).width = 20;
  abaConstrutivo.getColumn(2).width = 20;
  abaConstrutivo.getColumn(3).width = 16;
  abaConstrutivo.getColumn(4).width = 16;
  abaConstrutivo.getColumn(5).width = 24;

  abaConstrutivo.addRow(["Revestimento"]).font = { bold: true };
  abaConstrutivo.addRow([
    "Ordem",
    "Profundidade inicial (m)",
    "Profundidade final (m)",
    "Tipo",
    "Diâmetro",
    "Material",
  ]).font = { bold: true };
  poco.revestimentos.forEach((trecho) => {
    abaConstrutivo.addRow([
      trecho.ordem,
      numero(trecho.profundidadeInicial),
      numero(trecho.profundidadeFinal),
      rotulosTipoRevestimento[trecho.tipo],
      trecho.diametro,
      trecho.material,
    ]);
  });

  abaConstrutivo.addRow([]);
  abaConstrutivo.addRow(["Cimentação"]).font = { bold: true };
  abaConstrutivo.addRow([
    "Ordem",
    "Profundidade inicial (m)",
    "Profundidade final (m)",
  ]).font = { bold: true };
  poco.cimentacoes.forEach((trecho) => {
    abaConstrutivo.addRow([
      trecho.ordem,
      numero(trecho.profundidadeInicial),
      numero(trecho.profundidadeFinal),
    ]);
  });

  abaConstrutivo.addRow([]);
  abaConstrutivo.addRow(["Pré-filtro"]).font = { bold: true };
  abaConstrutivo.addRow([
    "Ordem",
    "Profundidade inicial (m)",
    "Profundidade final (m)",
    "Granulometria",
  ]).font = { bold: true };
  poco.preFiltros.forEach((trecho) => {
    abaConstrutivo.addRow([
      trecho.ordem,
      numero(trecho.profundidadeInicial),
      numero(trecho.profundidadeFinal),
      trecho.granulometria,
    ]);
  });

  // -------------------------------------------------------------------
  // Aba 4 — Teste de Vazão
  // -------------------------------------------------------------------
  const abaTesteVazao = workbook.addWorksheet("Teste de Vazão");
  abaTesteVazao.getColumn(1).width = 14;
  abaTesteVazao.getColumn(2).width = 20;
  abaTesteVazao.getColumn(3).width = 18;
  abaTesteVazao.getColumn(4).width = 22;
  abaTesteVazao.getColumn(5).width = 20;

  abaTesteVazao.addRow(["Resumo dos testes"]).font = { bold: true };
  abaTesteVazao.addRow([
    "Tipo",
    "Data/hora de início",
    "Nível estático (m)",
    "Nível dinâmico estabilizado (m)",
    "Vazão estabilizada (m³/h)",
  ]).font = { bold: true };
  poco.testesVazao.forEach((teste) => {
    const linha = abaTesteVazao.addRow([
      rotulosTipoTesteVazao[teste.tipo],
      data(teste.dataHoraInicio),
      numero(teste.nivelEstatico),
      numero(teste.nivelDinamicoEstabilizado),
      numero(teste.vazaoEstabilizada),
    ]);
    linha.getCell(2).numFmt = "dd/mm/yyyy hh:mm";
  });

  abaTesteVazao.addRow([]);
  abaTesteVazao.addRow(["Leituras"]).font = { bold: true };
  abaTesteVazao.addRow([
    "Tipo do teste",
    "Tempo (min)",
    "Nível dinâmico (m)",
    "Vazão (m³/h)",
  ]).font = { bold: true };
  poco.testesVazao.forEach((teste) => {
    teste.leituras.forEach((leitura) => {
      abaTesteVazao.addRow([
        rotulosTipoTesteVazao[teste.tipo],
        numero(leitura.tempoMinutos),
        numero(leitura.nivelDinamico),
        numero(leitura.vazao),
      ]);
    });
  });

  // -------------------------------------------------------------------
  // Aba 5 — Análise de Água
  // -------------------------------------------------------------------
  const abaAnaliseAgua = workbook.addWorksheet("Análise de Água");
  abaAnaliseAgua.columns = [
    { header: "Data da coleta", key: "dataColeta", width: 16 },
    { header: "Laboratório", key: "laboratorio", width: 30 },
    { header: "Parâmetro", key: "nome", width: 24 },
    { header: "Valor", key: "valor", width: 12 },
    { header: "Unidade", key: "unidade", width: 14 },
    { header: "VMP mínimo", key: "vmpMinimo", width: 12 },
    { header: "VMP máximo", key: "vmpMaximo", width: 12 },
  ];
  abaAnaliseAgua.getColumn("dataColeta").numFmt = "dd/mm/yyyy";
  poco.analisesAgua.forEach((analise) => {
    analise.parametros.forEach((parametro) => {
      abaAnaliseAgua.addRow({
        dataColeta: data(analise.dataColeta),
        laboratorio: analise.laboratorio,
        nome: parametro.nome,
        valor: numero(parametro.valor),
        unidade: parametro.unidade,
        vmpMinimo: numero(parametro.vmpMinimo),
        vmpMaximo: numero(parametro.vmpMaximo),
      });
    });
  });
  abaAnaliseAgua.getRow(1).font = { bold: true };

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
