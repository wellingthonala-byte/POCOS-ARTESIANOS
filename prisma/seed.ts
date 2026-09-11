import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const senhaHashPadrao = await bcrypt.hash("trocar123", 10);

  const admin = await prisma.usuario.create({
    data: {
      nome: "Marcos Alves",
      email: "admin@perfuradora.com.br",
      senhaHash: senhaHashPadrao,
      papel: "admin",
    },
  });

  const tecnico = await prisma.usuario.create({
    data: {
      nome: "Cleber Souza",
      email: "cleber.souza@perfuradora.com.br",
      senhaHash: senhaHashPadrao,
      papel: "tecnico_campo",
      telefone: "(34) 99123-4567",
      criadoPorId: admin.id,
    },
  });

  const responsavelTecnico = await prisma.usuario.create({
    data: {
      nome: "Fernanda Ribeiro",
      email: "fernanda.ribeiro@perfuradora.com.br",
      senhaHash: senhaHashPadrao,
      papel: "responsavel_tecnico",
      crea: "123456/D-MG",
      criadoPorId: admin.id,
    },
  });

  const cliente = await prisma.cliente.create({
    data: {
      nome: "Agropecuária Santa Fé Ltda",
      tipoPessoa: "juridica",
      documento: "12.345.678/0001-90",
      telefone: "(34) 3232-1010",
      email: "contato@agropecuariasantafe.com.br",
      endereco: "Rodovia BR-050, Km 12, Zona Rural",
      municipio: "Uberlândia",
      uf: "MG",
      criadoPorId: admin.id,
    },
  });

  const obra = await prisma.obra.create({
    data: {
      clienteId: cliente.id,
      nome: "Captação de Água — Sede da Fazenda Santa Fé",
      endereco: "Rodovia BR-050, Km 12, Zona Rural",
      municipio: "Uberlândia",
      uf: "MG",
      criadoPorId: tecnico.id,
    },
  });

  // ---------------------------------------------------------------------
  // Poço raso (60m, aquífero sedimentar — Grupo Bauru)
  // ---------------------------------------------------------------------

  const pocoRaso = await prisma.poco.create({
    data: {
      obraId: obra.id,
      identificacao: "PT-01",
      status: "concluido",
      latitude: "-18.9186000",
      longitude: "-48.2772000",
      metodoObtencaoCoordenada: "gps_celular",
      municipio: "Uberlândia",
      uf: "MG",
      metodoPerfuracao: "rotativo",
      dataInicioPerfuracao: new Date("2024-03-04"),
      dataFimPerfuracao: new Date("2024-03-06"),
      profundidadeFinal: "60.00",
      numeroArt: "MG20240012345",
      criadoPorId: tecnico.id,
    },
  });

  await prisma.camadaLitologica.createMany({
    data: [
      { pocoId: pocoRaso.id, ordem: 1, profundidadeInicial: "0.00", profundidadeFinal: "3.00", descricao: "Argila", criadoPorId: tecnico.id },
      { pocoId: pocoRaso.id, ordem: 2, profundidadeInicial: "3.00", profundidadeFinal: "15.00", descricao: "Areia argilosa", criadoPorId: tecnico.id },
      { pocoId: pocoRaso.id, ordem: 3, profundidadeInicial: "15.00", profundidadeFinal: "40.00", descricao: "Areia média a grossa", criadoPorId: tecnico.id },
      { pocoId: pocoRaso.id, ordem: 4, profundidadeInicial: "40.00", profundidadeFinal: "60.00", descricao: "Arenito friável", criadoPorId: tecnico.id },
    ],
  });

  await prisma.revestimento.createMany({
    data: [
      { pocoId: pocoRaso.id, ordem: 1, profundidadeInicial: "0.00", profundidadeFinal: "42.00", tipo: "liso", material: "PVC geomecânico", diametro: "6\"", criadoPorId: tecnico.id },
      { pocoId: pocoRaso.id, ordem: 2, profundidadeInicial: "42.00", profundidadeFinal: "57.00", tipo: "filtro", material: "PVC ranhurado", diametro: "6\"", criadoPorId: tecnico.id },
      { pocoId: pocoRaso.id, ordem: 3, profundidadeInicial: "57.00", profundidadeFinal: "60.00", tipo: "liso", material: "PVC geomecânico", diametro: "6\"", criadoPorId: tecnico.id },
    ],
  });

  await prisma.cimentacao.create({
    data: { pocoId: pocoRaso.id, ordem: 1, profundidadeInicial: "0.00", profundidadeFinal: "6.00", criadoPorId: tecnico.id },
  });

  await prisma.preFiltro.create({
    data: { pocoId: pocoRaso.id, ordem: 1, profundidadeInicial: "40.00", profundidadeFinal: "59.00", granulometria: "1-2mm", criadoPorId: tecnico.id },
  });

  await prisma.desenvolvimento.create({
    data: {
      pocoId: pocoRaso.id,
      metodo: "pistoneamento",
      dataInicio: new Date("2024-03-07T08:00:00Z"),
      dataFim: new Date("2024-03-07T12:00:00Z"),
      duracaoHoras: "4.00",
      observacoes: "Água clarificada após 3h de pistoneamento.",
      criadoPorId: tecnico.id,
    },
  });

  const testeVazaoRaso = await prisma.testeVazao.create({
    data: {
      pocoId: pocoRaso.id,
      tipo: "continuo",
      dataHoraInicio: new Date("2024-03-08T08:00:00Z"),
      nivelEstatico: "8.50",
      nivelDinamicoEstabilizado: "14.20",
      vazaoEstabilizada: "3.200",
      observacoes: "Teste de vazão contínuo de 6 horas, sem rebaixamento adicional após a 4ª hora.",
      criadoPorId: tecnico.id,
    },
  });

  await prisma.testeLeitura.createMany({
    data: [
      { testeVazaoId: testeVazaoRaso.id, tempoMinutos: "1", nivelDinamico: "9.80", vazao: "3.200", criadoPorId: tecnico.id },
      { testeVazaoId: testeVazaoRaso.id, tempoMinutos: "5", nivelDinamico: "11.40", vazao: "3.200", criadoPorId: tecnico.id },
      { testeVazaoId: testeVazaoRaso.id, tempoMinutos: "15", nivelDinamico: "12.60", vazao: "3.200", criadoPorId: tecnico.id },
      { testeVazaoId: testeVazaoRaso.id, tempoMinutos: "30", nivelDinamico: "13.50", vazao: "3.200", criadoPorId: tecnico.id },
      { testeVazaoId: testeVazaoRaso.id, tempoMinutos: "60", nivelDinamico: "14.00", vazao: "3.200", criadoPorId: tecnico.id },
      { testeVazaoId: testeVazaoRaso.id, tempoMinutos: "360", nivelDinamico: "14.20", vazao: "3.200", criadoPorId: tecnico.id },
    ],
  });

  const analiseAguaRaso = await prisma.analiseAgua.create({
    data: {
      pocoId: pocoRaso.id,
      dataColeta: new Date("2024-03-09"),
      laboratorio: "Laboratório Central de Análises Ambientais",
      criadoPorId: responsavelTecnico.id,
    },
  });

  await prisma.parametro.createMany({
    data: [
      { analiseAguaId: analiseAguaRaso.id, nome: "pH", valor: "6.80", unidade: "-", vmpMinimo: "6.00", vmpMaximo: "9.50", criadoPorId: responsavelTecnico.id },
      { analiseAguaId: analiseAguaRaso.id, nome: "Cor aparente", valor: "3.00", unidade: "uH", vmpMaximo: "15.00", criadoPorId: responsavelTecnico.id },
      { analiseAguaId: analiseAguaRaso.id, nome: "Turbidez", valor: "1.20", unidade: "NTU", vmpMaximo: "5.00", criadoPorId: responsavelTecnico.id },
      { analiseAguaId: analiseAguaRaso.id, nome: "Ferro total", valor: "0.12", unidade: "mg/L", vmpMaximo: "0.30", criadoPorId: responsavelTecnico.id },
      { analiseAguaId: analiseAguaRaso.id, nome: "Nitrato", valor: "2.40", unidade: "mg/L", vmpMaximo: "10.00", criadoPorId: responsavelTecnico.id },
      { analiseAguaId: analiseAguaRaso.id, nome: "Coliformes totais", valor: "0.00", unidade: "NMP/100mL", vmpMaximo: "0.00", criadoPorId: responsavelTecnico.id },
    ],
  });

  await prisma.anexo.createMany({
    data: [
      { pocoId: pocoRaso.id, tipo: "foto", arquivoUrl: "/uploads/seed/pt-01/cabeca-do-poco.jpg", nomeArquivo: "cabeca-do-poco.jpg", legenda: "Cabeça do poço concluída, com tampa sanitária.", incluirNoRelatorio: true, criadoPorId: tecnico.id },
      { pocoId: pocoRaso.id, tipo: "croqui", arquivoUrl: "/uploads/seed/pt-01/croqui-locacao.pdf", nomeArquivo: "croqui-locacao.pdf", legenda: "Croqui de acesso e locação do poço PT-01.", criadoPorId: tecnico.id },
      { pocoId: pocoRaso.id, tipo: "art", arquivoUrl: "/uploads/seed/pt-01/art-mg20240012345.pdf", nomeArquivo: "art-mg20240012345.pdf", criadoPorId: responsavelTecnico.id },
      { pocoId: pocoRaso.id, analiseAguaId: analiseAguaRaso.id, tipo: "laudo", arquivoUrl: "/uploads/seed/pt-01/laudo-fisico-quimico.pdf", nomeArquivo: "laudo-fisico-quimico.pdf", criadoPorId: responsavelTecnico.id },
    ],
  });

  // ---------------------------------------------------------------------
  // Poço profundo (180m, embasamento cristalino — gnaisse fraturado)
  // ---------------------------------------------------------------------

  const pocoProfundo = await prisma.poco.create({
    data: {
      obraId: obra.id,
      identificacao: "PT-02",
      status: "concluido",
      latitude: "-18.9310000",
      longitude: "-48.2650000",
      metodoObtencaoCoordenada: "gps_geodesico",
      municipio: "Uberlândia",
      uf: "MG",
      metodoPerfuracao: "rotopneumatico",
      dataInicioPerfuracao: new Date("2024-04-10"),
      dataFimPerfuracao: new Date("2024-04-22"),
      profundidadeFinal: "180.00",
      numeroArt: "MG20240015678",
      criadoPorId: tecnico.id,
    },
  });

  await prisma.camadaLitologica.createMany({
    data: [
      { pocoId: pocoProfundo.id, ordem: 1, profundidadeInicial: "0.00", profundidadeFinal: "2.00", descricao: "Solo residual argiloso", criadoPorId: tecnico.id },
      { pocoId: pocoProfundo.id, ordem: 2, profundidadeInicial: "2.00", profundidadeFinal: "15.00", descricao: "Saprolito de gnaisse (rocha alterada mole)", criadoPorId: tecnico.id },
      { pocoId: pocoProfundo.id, ordem: 3, profundidadeInicial: "15.00", profundidadeFinal: "60.00", descricao: "Gnaisse alterado (rocha alterada dura)", criadoPorId: tecnico.id },
      { pocoId: pocoProfundo.id, ordem: 4, profundidadeInicial: "60.00", profundidadeFinal: "180.00", descricao: "Gnaisse são, fraturado", criadoPorId: tecnico.id },
    ],
  });

  // Poço em rocha cristalina: revestimento apenas no trecho alterado; abaixo
  // disso o poço permanece aberto (sem revestimento nem pré-filtro).
  await prisma.revestimento.create({
    data: { pocoId: pocoProfundo.id, ordem: 1, profundidadeInicial: "0.00", profundidadeFinal: "65.00", tipo: "liso", material: "Aço carbono", diametro: "8 5/8\"", criadoPorId: tecnico.id },
  });

  await prisma.cimentacao.create({
    data: { pocoId: pocoProfundo.id, ordem: 1, profundidadeInicial: "0.00", profundidadeFinal: "8.00", criadoPorId: tecnico.id },
  });

  await prisma.desenvolvimento.create({
    data: {
      pocoId: pocoProfundo.id,
      metodo: "ar_comprimido",
      dataInicio: new Date("2024-04-23T08:00:00Z"),
      dataFim: new Date("2024-04-23T16:00:00Z"),
      duracaoHoras: "8.00",
      observacoes: "Desenvolvimento com ar comprimido nas fraturas produtoras entre 90m e 160m.",
      criadoPorId: tecnico.id,
    },
  });

  const testeVazaoProfundo = await prisma.testeVazao.create({
    data: {
      pocoId: pocoProfundo.id,
      tipo: "escalonado",
      dataHoraInicio: new Date("2024-04-24T08:00:00Z"),
      nivelEstatico: "22.30",
      observacoes: "Teste escalonado em 3 estágios de 60 minutos cada, vazões crescentes.",
      criadoPorId: tecnico.id,
    },
  });

  await prisma.testeLeitura.createMany({
    data: [
      // Estágio 1 — vazão 1,500 m³/h
      { testeVazaoId: testeVazaoProfundo.id, tempoMinutos: "1", nivelDinamico: "25.10", vazao: "1.500", criadoPorId: tecnico.id },
      { testeVazaoId: testeVazaoProfundo.id, tempoMinutos: "10", nivelDinamico: "28.40", vazao: "1.500", criadoPorId: tecnico.id },
      { testeVazaoId: testeVazaoProfundo.id, tempoMinutos: "30", nivelDinamico: "29.80", vazao: "1.500", criadoPorId: tecnico.id },
      { testeVazaoId: testeVazaoProfundo.id, tempoMinutos: "60", nivelDinamico: "30.00", vazao: "1.500", criadoPorId: tecnico.id },
      // Estágio 2 — vazão 2,500 m³/h
      { testeVazaoId: testeVazaoProfundo.id, tempoMinutos: "70", nivelDinamico: "34.20", vazao: "2.500", criadoPorId: tecnico.id },
      { testeVazaoId: testeVazaoProfundo.id, tempoMinutos: "90", nivelDinamico: "37.60", vazao: "2.500", criadoPorId: tecnico.id },
      { testeVazaoId: testeVazaoProfundo.id, tempoMinutos: "120", nivelDinamico: "38.10", vazao: "2.500", criadoPorId: tecnico.id },
      // Estágio 3 — vazão 3,500 m³/h
      { testeVazaoId: testeVazaoProfundo.id, tempoMinutos: "130", nivelDinamico: "43.50", vazao: "3.500", criadoPorId: tecnico.id },
      { testeVazaoId: testeVazaoProfundo.id, tempoMinutos: "150", nivelDinamico: "47.90", vazao: "3.500", criadoPorId: tecnico.id },
      { testeVazaoId: testeVazaoProfundo.id, tempoMinutos: "180", nivelDinamico: "48.60", vazao: "3.500", criadoPorId: tecnico.id },
    ],
  });

  const analiseAguaProfundo = await prisma.analiseAgua.create({
    data: {
      pocoId: pocoProfundo.id,
      dataColeta: new Date("2024-04-25"),
      laboratorio: "Laboratório Central de Análises Ambientais",
      criadoPorId: responsavelTecnico.id,
    },
  });

  await prisma.parametro.createMany({
    data: [
      { analiseAguaId: analiseAguaProfundo.id, nome: "pH", valor: "7.40", unidade: "-", vmpMinimo: "6.00", vmpMaximo: "9.50", criadoPorId: responsavelTecnico.id },
      { analiseAguaId: analiseAguaProfundo.id, nome: "Cor aparente", valor: "8.00", unidade: "uH", vmpMaximo: "15.00", criadoPorId: responsavelTecnico.id },
      { analiseAguaId: analiseAguaProfundo.id, nome: "Turbidez", valor: "2.10", unidade: "NTU", vmpMaximo: "5.00", criadoPorId: responsavelTecnico.id },
      // Ferro acima do VMP — comum em água subterrânea de gnaisse, útil para
      // testar o destaque visual de parâmetro fora do limite (Fase 6).
      { analiseAguaId: analiseAguaProfundo.id, nome: "Ferro total", valor: "0.58", unidade: "mg/L", vmpMaximo: "0.30", criadoPorId: responsavelTecnico.id },
      { analiseAguaId: analiseAguaProfundo.id, nome: "Nitrato", valor: "0.90", unidade: "mg/L", vmpMaximo: "10.00", criadoPorId: responsavelTecnico.id },
      { analiseAguaId: analiseAguaProfundo.id, nome: "Coliformes totais", valor: "0.00", unidade: "NMP/100mL", vmpMaximo: "0.00", criadoPorId: responsavelTecnico.id },
    ],
  });

  await prisma.anexo.createMany({
    data: [
      { pocoId: pocoProfundo.id, tipo: "foto", arquivoUrl: "/uploads/seed/pt-02/cabeca-do-poco.jpg", nomeArquivo: "cabeca-do-poco.jpg", legenda: "Cabeça do poço concluída, com sistema de proteção sanitária.", incluirNoRelatorio: true, criadoPorId: tecnico.id },
      { pocoId: pocoProfundo.id, tipo: "croqui", arquivoUrl: "/uploads/seed/pt-02/croqui-locacao.pdf", nomeArquivo: "croqui-locacao.pdf", legenda: "Croqui de acesso e locação do poço PT-02.", criadoPorId: tecnico.id },
      { pocoId: pocoProfundo.id, tipo: "art", arquivoUrl: "/uploads/seed/pt-02/art-mg20240015678.pdf", nomeArquivo: "art-mg20240015678.pdf", criadoPorId: responsavelTecnico.id },
      { pocoId: pocoProfundo.id, analiseAguaId: analiseAguaProfundo.id, tipo: "laudo", arquivoUrl: "/uploads/seed/pt-02/laudo-fisico-quimico.pdf", nomeArquivo: "laudo-fisico-quimico.pdf", criadoPorId: responsavelTecnico.id },
    ],
  });

  console.log("Seed concluído:");
  console.log(`  Usuários: ${admin.nome}, ${tecnico.nome}, ${responsavelTecnico.nome}`);
  console.log(`  Cliente: ${cliente.nome}`);
  console.log(`  Obra: ${obra.nome}`);
  console.log(`  Poços: ${pocoRaso.identificacao} (60m, sedimento), ${pocoProfundo.identificacao} (180m, cristalino)`);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
