# CLAUDE.md — Sistema de Relatórios de Poços

Este arquivo orienta qualquer trabalho no repositório. Leia junto com
`plano-sistema-relatorios-pocos.md` (visão de produto e modelo de dados) antes
de iniciar cada fase nova.

## Sobre o produto

Sistema web para uma empresa perfuradora brasileira acompanhar a execução de
poços tubulares e gerar o relatório técnico exigido para outorga em órgãos
estaduais e cadastro no SIAGAS/CPRM, seguindo a NBR 12212 (projeto) e a
NBR 12244 (construção).

Usuários de campo (perfuradores/técnicos) usam o celular na obra, muitas
vezes sem internet. O escritório usa desktop para revisar e emitir o
relatório final. A interface precisa ser simples e óbvia — o público não é
de tecnologia.

## Regra de idioma

**Todo o sistema é em português do Brasil**: interface, nomes de tabelas,
colunas, rotas, variáveis, funções, componentes e comentários de código.
Não misturar com inglês (nem em nomes de campos do banco, nem em texto de
tela). Nomes de bibliotecas, do próprio código de frameworks e de arquivos de
configuração seguem o padrão de cada ferramenta (ex.: `package.json`,
`schema.prisma`), isso não é exceção à regra — é o padrão da ferramenta.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
- Prisma 7 + PostgreSQL (cliente com driver adapter `@prisma/adapter-pg`)
- PWA com service worker para funcionamento offline (a partir da Fase 5)
- Autenticação com papéis: `admin`, `tecnico_campo`, `responsavel_tecnico`

### Decisão: banco de dados também em desenvolvimento

O plano original previa SQLite em desenvolvimento e PostgreSQL em produção.
O Prisma 7 usa um compilador de consultas por banco (WASM) e adapters de
conexão por provedor — um mesmo `schema.prisma` não troca de provedor entre
ambientes sem duplicar schema/migrations. Por isso o projeto usa **PostgreSQL
em todos os ambientes**. Em desenvolvimento local: instale o PostgreSQL 16 e
crie um banco e um usuário para o projeto, por exemplo:

```bash
sudo service postgresql start
sudo -u postgres psql -c "CREATE ROLE pocos LOGIN PASSWORD 'sua_senha' CREATEDB;"
sudo -u postgres psql -c "CREATE DATABASE pocos_artesianos OWNER pocos;"
```

Depois configure `DATABASE_URL` no `.env` (veja `.env.example`) e rode
`npx prisma migrate dev`. A opção `npx prisma dev` (Postgres local
descartável, sem instalação) também funciona como alternativa. `CREATEDB` é
necessário porque o Prisma Migrate cria um "shadow database" temporário para
calcular o diff de cada migration.

## Convenções de código

- Nomes de modelos, campos, variáveis, funções e componentes React em
  português (ex.: `poco`, `campoLitologico`, `calcularVazaoEspecifica`,
  `FormularioLocacao`).
- Profundidade sempre em metros, `Decimal` com 2 casas decimais (nunca
  `Float` — arredondamento de float corrompe medição de campo).
- Vazão em m³/h. Diâmetro em polegadas como `string` (ex.: `6"`, `8 5/8"`) —
  não converter para número.
- Coordenadas em SIRGAS 2000 (`Decimal` lat/long) com campo do método de
  obtenção (`gps_celular`, `gps_geodesico`, `manual`).
- Listas ordenadas por profundidade (camadas, revestimentos, cimentações,
  pré-filtros) têm campo de ordem explícito — nunca inferir ordem pela
  posição no array.
- Toda tabela: `criado_em`, `atualizado_em`, `criado_por_id`, `excluido_em`
  (exclusão lógica, nunca física — dado de campo não se apaga) e
  `sincronizado_em` (fila offline).
- Componente de tela grande é dividido em etapas menores, nunca uma página
  gigante — o formulário de poço, por exemplo, é sequencial por etapa.
- Alvo de toque mínimo de 44px, fontes grandes, mobile-first em qualquer tela
  usada em campo.

## Glossário do domínio

- **Nível estático**: profundidade do nível d'água no poço em repouso, sem
  bombeamento.
- **Nível dinâmico**: profundidade do nível d'água durante o bombeamento, em
  equilíbrio para uma vazão constante. Deve ser sempre maior que o nível
  estático (mais fundo).
- **Rebaixamento**: nível dinâmico menos o nível estático.
- **Vazão específica**: vazão dividida pelo rebaixamento (m³/h/m) — indica a
  capacidade produtiva do poço.
- **Pré-filtro**: material granular (areia/pedregulho calibrado) colocado no
  espaço anular ao redor do filtro para reter partículas finas da formação e
  evitar areamento do poço.
- **Pistoneamento**: técnica de desenvolvimento do poço que usa um pistão
  para induzir movimento alternado de água através do filtro, retirando
  partículas finas e melhorando a vazão.
- **Perfil litológico**: sequência de camadas de solo/rocha atravessadas
  pela perfuração, descrita pelo material natural encontrado (geologia).
- **Perfil construtivo**: sequência de elementos instalados no poço
  (revestimento liso, filtro, cimentação, pré-filtro) ao longo da
  profundidade — é a "engenharia" do poço, distinta do perfil litológico.
- **ART**: Anotação de Responsabilidade Técnica, documento emitido pelo CREA
  que vincula um profissional habilitado a uma obra ou serviço.
- **SIAGAS**: Sistema de Informações de Águas Subterrâneas, mantido pela
  CPRM, onde poços perfurados no Brasil devem ser cadastrados.

## Estrutura de pastas

```
src/
  app/
    clientes/            # CRUD de cliente (Fase 2)
    obras/                # CRUD de obra (Fase 2)
    configuracoes/        # Dados da empresa usados no relatório (Fase 3)
    pocos/               # Lista de poços, criação e edição (Fase 2)
      acoes.ts           # Server actions de poço ("use server")
      novo/page.tsx      # Criação — etapa 1 (identificação e locação)
      [id]/
        page.tsx                # Detalhe do poço + perfil litológico + baixar relatório
        identificacao/page.tsx  # Etapa 1 (editar poço existente)
        perfuracao/page.tsx     # Etapa 2
        litologia/page.tsx      # Etapa 3
        construtivo/page.tsx    # Etapa 4 (revestimento, cimentação, pré-filtro)
        niveis-vazao/page.tsx   # Etapa 5 (resumo simples do teste de vazão)
        relatorio/
          pdf/route.ts          # GET → PDF do relatório (Fase 3)
          excel/route.ts        # GET → planilha Excel do relatório (Fase 3)
  components/
    navegacao-principal.tsx  # Cabeçalho com links para Poços/Obras/Clientes/Configurações
    clientes/
    obras/
    configuracoes/
    pocos/               # Componentes de tela específicos de poço
      navegacao-etapas.tsx  # Barra de navegação entre as 5 etapas do poço
      perfil-poco.tsx       # Componente cliente: desenho do perfil + controle de escala
  hooks/
    usar-rascunho-formulario.ts  # Autosave de formulário em localStorage
    usar-lista-trechos.ts        # Wiring comum às listas de trechos encadeados
  lib/
    prisma.ts            # Cliente Prisma singleton (com driver adapter)
    usuario-atual.ts      # Placeholder até existir autenticação (ver seção abaixo)
    rotulos.ts            # Rótulos em português dos enums — única fonte, usada nas
                           # telas e nos relatórios
    escapar-html.ts        # Escape manual de texto do usuário em HTML/SVG montado como string
    relatorio/
      dados.ts            # Busca tudo que o relatório precisa para um poço
      template.ts          # Monta o HTML do PDF (strings simples, ver nota abaixo)
      pdf.ts               # HTML → PDF via Puppeteer (cabeçalho/rodapé, Página X de Y)
      excel.ts             # Workbook com as 5 abas via exceljs
      nome-arquivo.ts       # relatorio-poco-{identificacao}-{data}.{pdf,xlsx}
    perfil/                 # Desenho do perfil do poço (Fase 4)
      escala.ts             # Profundidade (m) → posição vertical (px), escala unificada + régua
      litologico.ts         # Classifica a litologia e gera o markup da coluna litológica
      construtivo.ts        # Gera o markup da coluna construtiva (furo, revestimento,
                             # cimentação, pré-filtro, níveis)
      perfil.ts             # Orquestra as duas colunas + régua num único SVG (`gerarSvgPerfilPoco`)
  generated/prisma/       # Código gerado pelo Prisma — NUNCA editar à mão
prisma/
  schema.prisma          # Schema do banco (entidades da Fase 1)
  seed.ts                # Seed de desenvolvimento (cliente, obra, 2 poços completos)
  migrations/            # Histórico de migrations — nunca editar migration aplicada
prisma7.config.ts        # Configuração do Prisma CLI (datasource, migrations, seed)
plano-sistema-relatorios-pocos.md  # Plano de produto e modelo de dados
```

Novas pastas (`src/components/`, `src/hooks/`, etc.) só entram no
repositório junto com o código que de fato as ocupa — nunca vazias.

### Placeholder: autenticação ainda não existe

Todo registro exige `criado_por_id`, mas a Fase de autenticação ainda não foi
implementada. Por isso `src/lib/usuario-atual.ts` retorna o primeiro usuário
`admin` do banco como "usuário atual" para toda escrita. Substituir pela
sessão autenticada assim que o login existir — não espalhar mais chamadas a
esse placeholder do que o necessário, para facilitar essa troca depois.

### Rascunho de formulário (autosave)

O requisito de "salvar rascunho a cada campo alterado" tem duas
implementações, dependendo se os campos da etapa aceitam nulo:

- **Etapa 1 (identificação e locação)**: campos obrigatórios (não aceitam
  nulo), então um poço parcialmente preenchido não pode ser persistido
  antes de existir no banco. Usa `useRascunhoFormulario` (localStorage,
  com debounce) como solução temporária — a Fase 5 (offline com IndexedDB)
  deve revisitar esse mecanismo.
- **Etapa 2 em diante (perfuração, litologia, ...)**: como o poço já existe
  e os campos são opcionais, o autosave grava direto no banco a cada
  alteração (debounce de 800ms via Server Action, sem passar por
  localStorage). Ver `FormularioPerfuracao` como referência para as
  próximas etapas.

### Etapa 5 (níveis e vazão) e a Fase 6

A etapa 5 do formulário do poço grava um resumo simples (nível estático,
nível dinâmico estabilizado, vazão estabilizada) direto no mesmo registro
`teste_vazao` que a Fase 6 vai usar para o teste de vazão completo
(cronômetro, múltiplas leituras por tempo, tipos escalonado/contínuo/
recuperação). Por padrão essa etapa cria o teste como `tipo: continuo`; a
Fase 6 deve reaproveitar o registro existente em vez de criar um duplicado
quando o poço já tiver um teste simples lançado por aqui.

### Relatório (PDF/Excel) — decisões da Fase 3

- **`configuracao`** é uma tabela singleton (sempre uma única linha) com os
  dados da empresa usados no cabeçalho/capa do relatório — nome, logo (URL),
  CNPJ, endereço, telefone, e-mail. Diferente das demais tabelas, não tem
  `criado_por_id`/`excluido_em`/`sincronizado_em`: não é dado de campo, é
  configuração da aplicação. Editável em `/configuracoes`.
- **`poco.responsavel_tecnico_id`**: faltava, na Fase 1, quem assina o
  relatório (nome + CREA) — só existia `numero_art`. Aponta para um
  `usuario` com `papel: responsavel_tecnico`; lançado na etapa 2
  (perfuração), junto do número da ART.
- **O template do relatório é HTML montado com strings simples
  (`template.ts`), não JSX/React**: o Next.js recusa buildar um Route
  Handler cujo grafo de módulos importe `react-dom/server`
  ("renderize como Server Component em vez disso"), o que inviabiliza usar
  `renderToStaticMarkup` para gerar o HTML que vai para o Puppeteer. Por
  causa disso, todo valor vindo de texto digitado pelo usuário é escapado
  manualmente com `escaparHtml` antes de entrar no template — não há o
  escape automático do JSX aqui. Ao mexer em `template.ts`, nunca interpole
  um campo de texto sem passar por `escaparHtml`.
- **Puppeteer roda com `--no-sandbox`**: necessário para funcionar como root
  em container. Cada chamada de `gerarRelatorioPdf` sobe e derruba um
  Chromium — aceitável na escala de uma única empresa; se o volume crescer,
  vale manter um browser Puppeteer persistente em vez de um por requisição.

### Perfil do poço (desenho) — decisões da Fase 4

- **Sem JSX/React, pelo mesmo motivo do relatório**: todo o desenho (colunas
  litológica e construtiva, `perfil.ts`) é gerado como string (não é
  componente React), para poder ser reaproveitado depois no PDF sem esbarrar
  na mesma restrição do Next.js contra `react-dom/server` em Route Handlers.
  `PerfilPoco` (componente cliente) só chama `gerarSvgPerfilPoco` e injeta o
  resultado via `dangerouslySetInnerHTML` — é esse wrapper que efetivamente
  "renderiza na tela"; o servidor (quando o desenho for embutido no PDF) vai
  chamar a mesma função diretamente.
- **Escala compartilhada entre as duas colunas ("escala elástica unificada")**:
  litologia e perfil construtivo são listas de trechos lançadas de forma
  independente (uma camada não tem por que coincidir com um trecho de
  revestimento), mas as duas colunas precisam bater com a mesma régua. A
  escala em `escala.ts` é construída a partir da UNIÃO de todos os limites de
  profundidade (camadas + revestimentos + cimentações + pré-filtros) via
  `coletarLimites`/`construirEscala` — não da lista de uma coluna isolada.
  Por isso `gerarMarkupColunaLitologica`/`gerarMarkupColunaConstrutiva` nunca
  indexam `segmentos[i]` supondo correspondência posicional com sua própria
  lista de trechos: cada trecho busca seu y0/y1 via `profundidadeParaY`,
  interpolando dentro do segmento unificado que o contém. `construirSegmentos`
  continua existindo só para uso isolado de uma única coluna (ex.:
  `gerarSvgPerfilLitologico` sozinho, sem construtivo).
- **Coluna construtiva — largura do furo por diâmetro**: `diametro` do
  revestimento é string livre (`6"`, `8 5/8"`, nunca convertida no banco,
  ver Convenções de código); `analisarDiametroPolegadas` faz o parse só para
  calcular a largura do desenho (nunca persiste de volta). O furo é desenhado
  com uma margem fixa (`MARGEM_ANULAR_POLEGADAS`) sobre o diâmetro do
  revestimento em cada trecho; abaixo do último revestimento lançado, o furo
  continua em trecho aberto (sem tubo, sem margem) — o caso comum de poço em
  rocha cristalina que não reveste até o fundo. Sem nenhum revestimento
  lançado ainda, usa um diâmetro padrão só para não desenhar um furo de
  largura zero.
- **Cimentação/pré-filtro ficam no espaço anular ao redor do revestimento**:
  como essas listas são lançadas de forma independente e podem não ter os
  mesmos limites de profundidade do revestimento, `buscarRevestimentoParaAnular`
  usa o trecho de revestimento que contém a profundidade de referência ou,
  na falta de um exato, o mais próximo por distância — só para saber a
  largura do "tubo" ali e desenhar a faixa anular (esquerda + direita) com a
  largura certa.
- **Classificação da litologia por palavra-chave**: `descricao` é texto
  livre (sem campo de "tipo" estruturado no schema), então a hachura
  (areia/argila/rocha/cascalho/outro) é escolhida por regex sobre o texto.
  É uma heurística, não uma classificação geológica exata — texto sem
  correspondência cai em "outro" (preenchimento neutro, sem hachura).
- **Escala com régua "elástica"**: camadas finas (< 1% da profundidade
  total) ganham altura mínima em vez de sumir, e a régua de profundidade
  usa a mesma função `profundidadeParaY` que posiciona as camadas — os
  traços da régua continuam batendo com os limites das camadas mesmo
  quando uma camada fina empurra a escala local.
- **Quebra de texto dos rótulos é por contagem de caracteres, não medição
  real**: não há canvas disponível nem no navegador nem no servidor para
  medir a largura exata do texto. `MAX_CARACTERES_POR_LINHA` em
  `litologico.ts` foi calibrado com folga para a fonte/tamanho usados — se
  mudar a fonte do rótulo, reveja essa constante (um rótulo comprido
  vazando para fora do SVG à esquerda é o sintoma).

## Fases do projeto

Ver `plano-sistema-relatorios-pocos.md`, seção 3, para a lista completa.
Cada fase é implementada e revisada antes de avançar para a próxima —
não adiante trabalho de uma fase futura sem que tenha sido pedido.
