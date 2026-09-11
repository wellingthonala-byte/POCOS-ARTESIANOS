# Plano — Sistema de Relatórios Técnicos de Poços Tubulares

## 1. Visão geral

Sistema web para uma empresa perfuradora brasileira gerenciar a execução de poços
tubulares profundos e gerar, ao final, o relatório técnico de construção exigido
para outorga em órgãos estaduais de recursos hídricos e para cadastro no
SIAGAS/CPRM. O sistema acompanha o poço desde a locação até o teste de vazão e a
análise de água, e produz o relatório final em PDF (documento oficial, assinado
pelo responsável técnico) e em Excel (dados brutos para uso interno).

Os relatórios seguem as normas técnicas:
- **NBR 12212** — Projeto de poço para captação de água subterrânea.
- **NBR 12244** — Construção de poço para captação de água subterrânea.

## 2. Personas e contexto de uso

- **Técnico de campo**: opera no celular, na obra, muitas vezes sem sinal de
  internet. Precisa lançar dados rapidamente durante a perfuração (litologia,
  revestimento, níveis d'água, teste de vazão) sem perder tempo nem dados.
  Não é usuário de tecnologia — a interface precisa ser autoexplicativa.
- **Responsável técnico (engenheiro/geólogo)**: revisa os dados lançados,
  complementa informações técnicas, assina o relatório com CREA e número da ART.
- **Administrativo/escritório**: cadastra clientes e obras, acompanha o
  andamento dos poços, gera e distribui o relatório final. Usa desktop.
- **Admin do sistema**: gerencia usuários, papéis e configurações da empresa
  (logo, dados cadastrais que aparecem no relatório).

Consequência para o produto: mobile-first para as telas de campo, com
funcionamento offline robusto; desktop é tratado como "mais uma tela maior",
sem funcionalidades exclusivas de desktop além da geração/revisão do relatório.

## 3. Fases do projeto

| Fase | Entregável |
|---|---|
| 0 | Setup do projeto, CLAUDE.md, estrutura Next.js/Tailwind/Prisma (sem schema/telas) |
| 1 | Modelo de dados (schema Prisma, migrations, seed) |
| 2 | CRUD de cliente/obra/poço + lançamento de perfil litológico e construtivo |
| 3 | Geração de relatório em PDF e Excel (tabelas, sem desenho gráfico) |
| 4 | Desenho do perfil do poço (SVG litológico + construtivo lado a lado) |
| 5 | Funcionamento offline (PWA, IndexedDB, fila de sincronização) |
| 6 | Teste de vazão, análise físico-química e anexos |

Cada fase é implementada e revisada antes de avançar para a próxima.

## 4. Modelo de dados (entidades)

- **usuario** — pessoa que acessa o sistema. Papéis: `admin`, `tecnico_campo`,
  `responsavel_tecnico`. Guarda também dados para assinatura do relatório
  quando o papel é responsável técnico (nome, CREA, registro profissional).
- **cliente** — contratante da obra (pessoa física ou jurídica).
- **obra** — empreendimento do cliente onde um ou mais poços são executados
  (endereço, município, UF).
- **poco** — poço tubular em si: identificação, obra e cliente vinculados,
  locação (coordenadas SIRGAS 2000 + método de obtenção), dados de perfuração
  (método, datas, profundidade final), status de execução.
- **camada_litologica** — trecho do perfil litológico do poço: profundidade
  inicial/final, descrição, ordem. Lista ordenada por profundidade.
- **revestimento** — trecho de revestimento (liso ou filtro) do perfil
  construtivo: profundidade inicial/final, diâmetro, material, tipo (liso/filtro),
  ordem.
- **cimentacao** — trecho de cimentação no espaço anular: profundidade
  inicial/final, ordem.
- **pre_filtro** — trecho de pré-filtro (engaste de areia/pedregulho) no espaço
  anular: profundidade inicial/final, granulometria, ordem.
- **desenvolvimento** — registro das atividades de desenvolvimento do poço
  (pistoneamento, ar comprimido, etc.): método, duração, observações.
- **teste_vazao** — ensaio de vazão do poço: tipo (`escalonado`, `continuo`,
  `recuperacao`), vazão, nível estático, data/hora de início.
- **teste_leitura** — leitura pontual dentro de um teste de vazão: tempo
  decorrido, nível dinâmico, vazão (para o escalonado).
- **analise_agua** — laudo físico-químico/bacteriológico da água do poço:
  data da coleta, laboratório, anexo do laudo original.
- **parametro** — parâmetro individual dentro de uma análise de água: nome,
  valor, unidade, VMP (valor máximo permitido) de potabilidade.
- **anexo** — arquivo vinculado ao poço: foto (com legenda), ART em PDF,
  croqui de locação, laudo de análise. Fotos podem ser marcadas para entrar
  no relatório final.

Regras de modelagem que valem para todas as entidades relevantes:
- Profundidade sempre em metros, 2 casas decimais, tipo `Decimal` (nunca float).
- Vazão em m³/h. Diâmetro em polegadas, como string (ex.: `6"`, `8 5/8"`).
- Coordenadas em SIRGAS 2000, `Decimal`, com campo de método de obtenção
  (`gps_celular`, `gps_geodesico`, `manual`).
- Listas ordenadas por profundidade (camadas, revestimentos, cimentações,
  pré-filtros) têm campo de ordem explícito.
- Toda tabela tem `criado_em`, `atualizado_em`, `criado_por_id`.
- Exclusão sempre lógica (`excluido_em`), nunca física.
- Toda tabela tem `sincronizado_em` (nullable) para suportar a fila offline.

## 5. Requisitos de interface

- Mobile-first, alvos de toque ≥ 44px, fontes grandes, poucos cliques.
- Formulário de poço em etapas: (1) identificação e locação, (2) perfuração,
  (3) litologia, (4) construtivo, (5) níveis e vazão.
- Botão de "usar GPS do celular", sempre editável manualmente.
- Lançamento de camadas/trechos por profundidade final (a inicial vem da
  camada anterior), com sugestões pré-cadastradas de descrição.
- Salvamento automático de rascunho a cada alteração de campo.
- Validações de domínio: profundidade final > inicial, sem vão nem
  sobreposição entre camadas, nível dinâmico > nível estático, filtro dentro
  do intervalo perfurado.

## 6. Relatório (PDF e Excel)

PDF como saída prioritária, via template HTML renderizado, com: capa,
dados cadastrais e locação, dados de perfuração, perfil litológico, perfil
construtivo, níveis e vazão, e espaço de assinatura do responsável técnico
(nome, CREA, ART). Cabeçalho/rodapé com numeração em todas as páginas. Logo
e dados da empresa vêm de configuração, nunca hardcoded. Seção sem dado
opcional simplesmente não aparece (sem "N/A" solto). Nome de arquivo:
`relatorio-poco-{identificacao}-{data}.pdf`.

Excel com uma aba por conjunto de dados (Dados Gerais, Litologia,
Construtivo, Teste de Vazão, Análise de Água), sem formatação elaborada.

O desenho gráfico do perfil (SVG) é tratado à parte, na Fase 4, depois de
validado o restante do relatório com o cliente.

## 7. Funcionamento offline

PWA com service worker (estratégia app shell), espelhamento das tabelas
principais em IndexedDB, fila de sincronização para alterações feitas
offline, indicador permanente de status (online/offline/pendências),
resolução de conflito por last-write-wins por timestamp — mas nunca
sobrescrevendo silenciosamente: conflito real preserva as duas versões para
revisão manual no escritório. Fotos offline entram em fila separada de
upload em segundo plano.

## 8. Glossário técnico

- **Nível estático**: profundidade do nível d'água no poço em repouso, sem
  bombeamento.
- **Nível dinâmico**: profundidade do nível d'água durante o bombeamento, em
  equilíbrio para uma dada vazão.
- **Rebaixamento**: diferença entre o nível dinâmico e o nível estático.
- **Vazão específica**: vazão dividida pelo rebaixamento (m³/h/m); indica a
  capacidade específica do poço.
- **Pré-filtro**: material granular (areia/pedregulho) colocado no espaço
  anular ao redor do filtro para reter partículas finas da formação.
- **Pistoneamento**: técnica de desenvolvimento do poço que usa um pistão
  para induzir movimento alternado de água através do filtro, retirando
  partículas finas e melhorando a vazão.
- **Perfil litológico**: sequência de camadas de solo/rocha atravessadas
  pela perfuração, descritas por tipo de material.
- **Perfil construtivo**: sequência de elementos instalados no poço
  (revestimento liso, filtro, cimentação, pré-filtro) ao longo da
  profundidade — é a "engenharia" do poço, distinta da geologia natural do
  perfil litológico.
- **ART**: Anotação de Responsabilidade Técnica, documento emitido pelo
  CREA que vincula um profissional a uma obra ou serviço.
- **SIAGAS**: Sistema de Informações de Águas Subterrâneas, mantido pela
  CPRM, onde poços cadastrados no Brasil são registrados.

## 9. Fora de escopo (por ora)

- Faturamento/financeiro da obra.
- Múltiplas empresas (multi-tenant) — o sistema atende uma única empresa
  perfuradora.
- Assinatura digital com certificado ICP-Brasil (o campo de assinatura no
  PDF é para impressão e assinatura física, ou anexação posterior do PDF
  assinado).
