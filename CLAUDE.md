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
    conflitos/            # Revisão manual de conflito de sincronização (Fase 5)
      page.tsx            # Lista os conflitos pendentes (resolvido_em nulo)
      acoes.ts            # Server action que resolve um conflito (manter servidor/aplicar local)
    pocos/               # Lista de poços, criação e edição (Fase 2)
      acoes.ts           # Server actions de poço ("use server")
      novo/page.tsx      # Criação — etapa 1 (identificação e locação)
      [id]/
        page.tsx                # Detalhe do poço + desenho do perfil + baixar relatório
        identificacao/page.tsx  # Etapa 1 (editar poço existente)
        perfuracao/page.tsx     # Etapa 2
        litologia/page.tsx      # Etapa 3
        construtivo/page.tsx    # Etapa 4 (revestimento, cimentação, pré-filtro)
        niveis-vazao/page.tsx   # Etapa 5 (resumo simples do teste de vazão)
        teste-vazao/page.tsx    # Teste de vazão completo — leituras, cronômetro, gráficos (Fase 6)
        relatorio/
          pdf/route.ts          # GET → PDF do relatório (Fase 3)
          excel/route.ts        # GET → planilha Excel do relatório (Fase 3)
    offline/
      page.tsx             # Fallback do service worker quando não há rede nem cache (Fase 5) —
                           # de propósito NÃO é componente cliente do Next, ver script-offline.ts
      script-offline.ts     # Script vanilla (não é bundle React) injetado inline nessa página
  components/
    navegacao-principal.tsx  # Cabeçalho com links para Poços/Obras/Clientes/Configurações/Conflitos —
                             # de propósito sem busca de dado, ver comentário no arquivo
    clientes/
    obras/
    configuracoes/
    conflitos/
      cartao-conflito.tsx  # Compara dado do servidor × dado offline e resolve (Fase 5)
    pocos/               # Componentes de tela específicos de poço
      navegacao-etapas.tsx  # Barra de navegação entre as 5 etapas do poço
      perfil-poco.tsx       # Componente cliente: desenho do perfil + controle de escala
      teste-vazao-completo.tsx  # Config do teste, leituras, gráficos (Fase 6)
      cronometro.tsx             # Cronômetro pra cronometrar leitura em campo
    pwa/                  # Fase 5
      registrar-service-worker.tsx  # Só o efeito de registrar o service worker
      indicador-conectividade.tsx    # Indicador permanente online/offline no cabeçalho
      espelhar-poco-offline.tsx      # Grava o detalhe do poço aberto agora em IndexedDB
      espelhar-lista-pocos-offline.tsx  # Idem, resumo de cada poço da lista
  hooks/
    usar-rascunho-formulario.ts  # Autosave de formulário em localStorage
    usar-lista-trechos.ts        # Wiring comum às listas de trechos encadeados
    usar-autosave-poco.ts        # Autosave com debounce direto no banco (perfuração, níveis)
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
      mapear-dados.ts        # Poço do Prisma (campos Decimal) → formato plano do desenho —
                             # única fonte usada pela tela e pelo relatório em PDF
    offline/
      banco.ts               # Abertura do IndexedDB compartilhado — única fonte do
                             # nome/versão/tabelas do banco (Fase 5)
      banco-local.ts         # Espelho em IndexedDB dos poços já abertos com internet
      fila-sincronizacao.ts  # Fila de gravações que falharam por falta de rede
      envolver-acao.ts        # Wrapper genérico "tenta a action; se falhar por rede, enfileira"
      registro-acoes.ts      # Mapa tipo → server action, usado por enfileirar/sincronizar
    graficos/
      grafico-linha.ts        # Gráfico de linha em SVG (string, sem lib) — Fase 6
      sincronizar.ts         # Reaplica a fila quando a conexão volta
  generated/prisma/       # Código gerado pelo Prisma — NUNCA editar à mão
public/
  manifest.json           # Manifest da PWA (Fase 5)
  service-worker.js        # Service worker do app shell (Fase 5) — precisa ficar na raiz
                           # pública para o escopo de registro cobrir o site inteiro
  icons/                  # Ícones da PWA (192, 512, maskable, apple-touch-icon)
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
`teste_vazao` que a tela de teste de vazão completo da Fase 6
(`/pocos/[id]/teste-vazao`) usa — por padrão essa etapa cria o teste como
`tipo: continuo`, e a tela da Fase 6 reaproveita esse registro (não cria
um duplicado): ela exige que um teste já exista, orientando a lançar o
nível estático pela etapa 5 primeiro em vez de duplicar esse campo lá.

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
- **O desenho embutido no PDF (`template.ts`, seção "Desenho do perfil")
  reaproveita a mesma `gerarSvgPerfilPoco` da tela**, via `mapear-dados.ts`
  (extraído para não duplicar a conversão Decimal→número entre
  `/pocos/[id]/page.tsx` e o relatório). Diferença única: no PDF não há
  ajuste manual de escala nem rolagem horizontal, então o `<svg>` raiz é
  pós-processado para `width="100%" height="auto"` (mantendo o `viewBox`
  original) — ele escala proporcionalmente à largura impressa da página,
  não importa a profundidade do poço. A seção começa em página nova
  (`break-before: page`) por ser um bloco visual único que não faz sentido
  partir ao meio; a altura sobra livre para o Chromium paginar
  normalmente quando o poço for muito profundo.

### Offline (PWA) — decisões da Fase 5

A Fase 5 tem várias entregas (ver plano, seção 7); a primeira etapa
implementada é só a base de app shell instalável — IndexedDB e fila de
sincronização ficam para as próximas etapas.

- **Etapa 1 — app shell instalável (`public/manifest.json`,
  `public/service-worker.js`)**: service worker escrito à mão (sem
  `next-pwa` ou lib parecida) — o projeto já tinha o precedente de preferir
  solução direta a dependência externa (ver o motivo do `template.ts` sem
  JSX), e libs de PWA baseadas em Workbox/webpack têm histórico de atrito
  com o App Router + Turbopack do Next 15.
- **O service worker NUNCA cacheia página com dado de poço**: só entram no
  cache os arquivos verdadeiramente estáticos (`_next/static/*`,
  `/icons/*`, `/manifest.json`) e a página `/offline` — cachear uma página
  renderizada no servidor (ex.: `/pocos/[id]`) arriscaria mostrar dado
  desatualizado pro técnico em campo achando que é o estado atual. Ver
  `ehAssetEstatico` em `service-worker.js`. Estratégia por tipo de
  requisição: navegação de página é sempre rede-primeiro (cai pro cache/
  `/offline` só se a rede falhar de verdade); asset estático é
  cache-first.
- **`IndicadorConectividade` usa `navigator.onLine`/eventos
  `online`/`offline`, não "o servidor respondeu"**: é a limitação da API do
  navegador — ela reflete a interface de rede do aparelho (Wi-Fi/dados
  ligados ou não), não se o servidor da aplicação está de pé. Para o caso
  de uso real (técnico sem sinal na obra) é exatamente o que se quer medir;
  não confundir com "a última requisição teve sucesso" (isso é outra
  informação, que só a fila de sincronização de uma etapa futura vai
  cobrir). Renderiza "online" por padrão até montar no cliente (efeito
  colateral do SSR não ter `navigator`), pra não divergir do HTML do
  servidor.
- **Teste de fallback offline não usa `context.setOffline()` do
  Playwright**: essa API do Playwright não é confiável para testar o
  `fetch` feito de dentro do `fetch` handler do service worker — o
  navegador continua completando a requisição normalmente nesse cenário de
  teste (parece um request de um worker não seguir a emulação de rede da
  página no Chromium/CDP). O teste que funciona de verdade é matar o
  processo do servidor e navegar para uma rota ainda não cacheada.
- **Etapa 2 — espelho de leitura em IndexedDB (`src/lib/offline/banco-local.ts`)**:
  cada visita com internet à lista de poços ou ao detalhe de um poço grava
  (via `EspelharListaPocosOffline`/`EspelharPocoOffline`, montados nas
  respectivas páginas) um snapshot em IndexedDB. É só leitura — lançar/
  editar dado ainda exige conexão, isso fica pra fila de sincronização de
  uma etapa futura. `salvarPocoOffline` faz merge com o que já existe em
  vez de sobrescrever: a lista só manda campos de resumo (identificação,
  status, obra/cliente), o detalhe manda tudo (+ litologia/construtivo via
  `mapearDadosParaPerfil`) — visitar a lista depois de já ter visto o
  detalhe não pode apagar o que foi espelhado antes.
- **A página `/offline` NÃO pode ser um componente cliente do Next
  (sem hooks, sem `"use client"`)**: foi a primeira versão desta etapa e
  quebrou — o Next dá a cada rota cliente seu próprio chunk JS, e esse
  chunk só é buscado/cacheado quando alguém efetivamente visita a rota; como
  ninguém abre `/offline` estando online, o chunk nunca está em cache e a
  página trava com `ChunkLoadError` bem no momento em que devia funcionar
  sem rede. A solução (`script-offline.ts`) é um script vanilla (sem
  React) injetado inline via `<script dangerouslySetInnerHTML>` — inline
  quer dizer que ele é parte do mesmo HTML que o `cache.addAll` do service
  worker já guarda pra essa rota, sem requisição extra nenhuma. Esse script
  duplica a leitura do IndexedDB (`abrirBanco`/`buscarPoco`/`listarPocos`)
  e os rótulos/cores de status — mantenha em sincronia com
  `banco.ts`/`banco-local.ts`/`rotulos.ts` se algo aí mudar, **incluindo o
  número da versão do banco** (`indexedDB.open('pocos-offline', 2)`,
  hardcoded ali por não poder importar `VERSAO_BANCO` de `banco.ts` num
  script solto): abrir com uma versão MENOR que a atual do banco falha com
  `VersionError` — subir `VERSAO_BANCO` sem atualizar esse número quebra
  a página de fallback offline. Os links dentro dessa
  página usam `<a>` normal, não `<Link>` do Next: uma navegação cliente
  buscaria o RSC payload pela rede e falharia sem cair de volta no service
  worker do jeito esperado — só uma navegação de página cheia (`<a>`, ou
  recarregar/digitar a URL) é interceptada pelo `fetch` handler.
- **Etapa 3 — fila de sincronização para gravação offline**: antes desta
  etapa, submeter qualquer formulário sem rede quebrava a tela inteira com
  "Application error" — uma Server Action chamada do cliente faz uma
  requisição de verdade, e se ela falhar por falta de rede o erro chega
  como `TypeError: Failed to fetch` (verificado empiricamente derrubando o
  servidor no meio de um submit) sem que o corpo da action no servidor
  chegue a rodar, então não tinha como capturar isso *dentro* da action.
  A correção entra na CHAMADA da action, não nela: `envolver-acao.ts`
  exporta `envolverAcaoComFilaOffline`, que troca a action real por uma
  versão que tenta a chamada e, se rejeitar com `TypeError`, guarda
  `{tipo, pocoId, payload}` em `fila-sincronizacao.ts` (IndexedDB) e
  devolve `{...estadoAnterior, sucesso: true, pendente: true}` em vez de
  propagar o erro. `useListaTrechos` (litologia/revestimento/cimentação/
  pré-filtro) usa isso direto no lugar de `acaoAdicionar`/`acaoRemover`
  antes de passar pro `useActionState` — o retorno "pendente" reaproveita
  o reset-de-formulário-e-foco que já existia pro caminho de sucesso, dá
  pra continuar lançando trechos em sequência mesmo offline. As telas de
  autosave direto no banco (perfuração, níveis e vazão — antes duplicadas
  quase igual, agora unificadas em `useAutosavePoco`) usam o mesmo wrapper
  dentro do `startTransition`. A edição de identificação/locação de um
  poço já existente (`FormularioIdentificacaoLocacao`, quando
  `valoresIniciais.id` existe) também envolve sua `acao` da mesma forma —
  mas **criar um poço novo (`criarPoco`, sem `id` ainda) fica de fora de
  propósito**: sem ID do banco não dá pra navegar pra próxima etapa nem
  saber pra qual poço a gravação pertence, e resolver isso exigiria gerar
  um ID temporário no cliente e reconciliar com o ID real depois de
  sincronizar — criar um poço novo sem conexão continua quebrando a tela
  até esse mecanismo existir. Como o retorno "pendente" de uma edição não
  carrega o `pocoId` de volta (a action real nunca rodou), o efeito que
  decide pra onde navegar usa `estado.pocoId ?? pocoId` (o ID já conhecido
  de antes) — sem isso, editar identificação offline navegava de volta pra
  lista genérica de poços em vez de seguir pra próxima etapa do fluxo.
- **`registro-acoes.ts` mapeia string→server action** porque IndexedDB só
  guarda dado serializável, nunca uma referência de função — o item da fila
  guarda só o `tipo` (ex.: `"litologia.adicionar"`), e tanto enfileirar
  quanto `sincronizarFila` (`sincronizar.ts`) consultam esse mapa pra saber
  qual action chamar. Toda tela nova que passe a usar
  `envolverAcaoComFilaOffline` precisa de uma linha correspondente aqui,
  com o mesmo texto de `tipo` usado na chamada.
- **`sincronizarFila` processa a fila agrupada por poço, e para a cadeia
  daquele poço na primeira falha**: os itens de um mesmo poço formam uma
  sequência que faz sentido só naquela ordem (ex.: as actions de
  "adicionar"/"remover última" recalculam a última ordem/profundidade
  consultando o banco a cada chamada — não guardam um ID decidido no
  cliente — o que só dá o resultado certo se forem reaplicadas na ordem
  original), então uma falha no meio não pode deixar os itens seguintes
  daquele poço passarem na frente fora de ordem. Poços diferentes são
  filas independentes e não se bloqueiam entre si. Disparada automaticamente
  pelo `IndicadorConectividade` no evento `online` e também ao montar (caso
  o app tenha sido reaberto já com internet e ainda haja pendência de uma
  sessão offline anterior) — um `sincronizado > 0` chama `router.refresh()`
  pra tela atual parar de mostrar o dado antigo.
- **O indicador de pendências não tem como ouvir mudança de IndexedDB
  nativamente** — `enfileirar`/`removerDaFila`/`registrarFalhaNaFila`
  disparam um `Event` simples no `window` (`ouvirMudancasNaFila`) só pra
  avisar `IndicadorConectividade` de que a contagem mudou, sem precisar de
  polling nem de uma lib de estado.
- **Testado derrubando o processo do servidor de verdade** (mesmo motivo
  da etapa 1: `context.setOffline()` do Playwright não afeta o `fetch` da
  Server Action de forma confiável) — submissão offline não quebra mais a
  tela, o item aparece na fila em IndexedDB, e religando o servidor +
  recarregando a página (simulando o técnico reabrindo o app com sinal de
  volta) sincroniza e o dado aparece de verdade no Postgres. Cobre
  adicionar/remover trecho, autosave de perfuração e edição de
  identificação de um poço existente (inclusive um caso em que o próprio
  `router.push` pós-edição falhou por causa da rede e o Next caiu pra
  navegação de página cheia no meio do teste — o item continuou intacto na
  fila e sincronizou normalmente assim que o servidor voltou, sem duplicar
  nem perder a tentativa).
- **Etapa 4 — detecção de conflito (`conflito_edicao`, `/conflitos`)**: só
  se aplica às três telas de "sobrescrever campo" (identificação,
  perfuração, níveis e vazão) — litologia/construtivo ficam de fora de
  propósito, ver abaixo. Cada gravação dessas manda junto o
  `baseAtualizadoEm` (o `atualizado_em` do registro no momento em que a
  tela carregou, ou da última gravação bem-sucedida — rastreado num
  `useRef`/`useState` no cliente, nunca em `valores`, pra não ir parar no
  rascunho). `aplicarComVerificacaoDeConflito` (`pocos/acoes.ts`) compara
  esse valor com o `atualizado_em` atual do registro (`poco` para
  identificação/perfuração, `teste_vazao` para níveis — cada uma tem sua
  função `buscarEstado*`); se bateu, aplica normal; se não bateu — alguém
  mudou o registro nesse meio-tempo —, a gravação NÃO é aplicada: grava as
  duas versões em `conflito_edicao` e devolve `{conflito: true}` em vez de
  `{sucesso: true}` puro. A tela mostra um aviso amarelo específico
  ("alguém alterou este poço... esta alteração NÃO foi salva") e não
  navega nem limpa rascunho — nunca finge que salvou.
- **Por que só as 3 telas de sobrescrita**: litologia/revestimento/
  cimentação/pré-filtro "adicionar"/"remover última" recalculam a
  ordem/profundidade consultando o banco a cada chamada — nunca sobrescrevem
  um valor que já existe, só acrescentam ou removem o último. Não têm o
  mesmo risco de "perder silenciosamente o que alguém mais escreveu" que
  motivou esta etapa; adicionar detecção de conflito ali seria complexidade
  sem um problema real por trás.
- **Coalescer a fila para essas 3 telas (`enfileirarOuSubstituir`)**: like
  perfuração/níveis re-salvam a cada 800ms (debounce), editar um campo
  várias vezes offline sem coalescer criaria uma cadeia de itens cada um
  com o `baseAtualizadoEm` de quando ficou offline — ao reaplicar em
  sequência, o segundo item acusaria conflito contra o `atualizado_em` que
  o PRÓPRIO primeiro item acabou de avançar. Como essas telas são sempre
  uma sobrescrita completa (só o valor mais recente importa), em vez de
  empilhar mais um item, `enfileirarOuSubstituir` substitui o item pendente
  do mesmo tipo/poço pelo payload mais novo, mas mantém o
  `baseAtualizadoEm` ORIGINAL (da primeira edição offline da sequência) —
  esse sim precisa bater com o servidor.
- **Depois de um conflito, o `baseAtualizadoEm` conhecido no cliente NÃO
  avança**: fica parado no valor antigo de propósito. Isso é deliberado —
  se avançasse pro valor atual do servidor, uma segunda tentativa (mesmo
  sem o usuário fazer nada além de clicar "salvar" de novo) sobrescreveria
  o servidor sem novo aviso, na prática contornando a proteção. Ficando
  travado, qualquer nova tentativa continua acusando conflito até o
  usuário recarregar a página (e assim pegar o `atualizado_em` real) — o
  preço é possível "spam" de conflito em vez de sobrescrita silenciosa, e
  entre os dois o plano é explícito sobre qual errar.
- **`/conflitos` é a revisão manual do escritório**: lista todo
  `conflito_edicao` com `resolvido_em` nulo, mostra as duas versões lado a
  lado (rótulos de campo em `rotulosCamposConflito`, não os nomes crus do
  banco) e resolve de duas formas — "manter servidor" só marca resolvido;
  "aplicar dado offline" chama a MESMA server action do
  `registro-acoes.ts` da fila de sincronização, mas com um `FormData` sem
  `baseAtualizadoEm` — a ausência dessa marca já faz a action aplicar
  direto sem checar conflito de novo (é uma decisão consciente de quem
  está revisando, não uma repetição cega da fila). Rótulos de campo cru
  (`responsavelTecnicoId` mostra o ID, não o nome do usuário) e datas ISO
  cruas na coluna "no servidor agora" (vindas de `Date.toISOString()`) são
  um acabamento pendente — funcional, mas menos legível do que poderia ser;
  revisar se isso incomodar no uso real.
- **`NavegacaoPrincipal` de propósito NÃO busca a contagem de conflitos
  pendentes**: cheguei a testar um badge com `prisma.conflitoEdicao.count()`
  ali, mas esse componente é usado pelo layout raiz, herdado até pela
  página estática `/offline` — o Next precisa executar a árvore inteira
  pra pré-renderizar uma rota estática, então a contagem embutida ficaria
  congelada no valor de quando rodou `next build` (exigindo Postgres de pé
  nesse momento, o que não deveria ser um requisito só por causa de um
  badge decorativo). Ficou só um link simples, sem contagem.
- **Testado derrubando o servidor de verdade e simulando o "escritório"
  via uma gravação real pelo Prisma** (não `UPDATE` direto por SQL — isso
  não aciona o `@updatedAt` do Prisma, e a primeira tentativa desse teste
  usou SQL direto e não gerou conflito nenhum, confirmando na prática por
  que a detecção depende do `atualizado_em` avançar de verdade): o dado do
  "escritório" foi preservado, o conflito foi gravado com as duas versões,
  a fila local foi esvaziada (o conflito é o item "tratado"), e resolver
  via "aplicar dado offline" reaplicou o valor do técnico corretamente.

### Teste de vazão completo — decisões da Fase 6

- **`/pocos/[id]/teste-vazao` exige que já exista um `teste_vazao`**: em
  vez de duplicar o campo de nível estático (obrigatório no banco) nessa
  tela também, ela só orienta a lançar pela etapa 5 ("Níveis e vazão")
  primeiro se ainda não existir nenhum. Ver seção acima.
- **Leituras são uma lista encadeada por TEMPO, não por profundidade**:
  reaproveita o mesmo `useListaTrechos` das listas de trecho (litologia/
  construtivo) — o padrão "próxima começa onde a anterior terminou" vale
  igual trocando profundidade por tempo decorrido (`tempo_minutos` da nova
  leitura tem que ser maior que o da última já lançada). `vazao` por
  leitura só é obrigatória quando `tipo === "escalonado"` (cada estágio do
  escalonado tem sua própria vazão; contínuo/recuperação usam uma vazão
  única, lançada direto no campo "Vazão estabilizada" da etapa 5).
- **Cronômetro (`cronometro.tsx`) só preenche o campo de tempo decorrido,
  não substitui digitação manual**: "Usar este tempo" calcula os minutos
  a partir do relógio (`Date.now()`, não `setInterval` acumulando erro) e
  escreve no input do formulário de leitura — o técnico ainda confere/edita
  antes de enviar. Cronômetro e formulário são componentes desacoplados de
  propósito (o cronômetro não sabe nada sobre teste de vazão), conectados só
  por essa função de callback.
- **Gráficos (`grafico-linha.ts`) são SVG gerado como string, sem lib de
  gráfico** — mesmo raciocínio do desenho do perfil (Fase 4): evita puxar
  uma dependência nova pra um punhado de pontos, e mantém a porta aberta
  pra reaproveitar a mesma função se esses gráficos precisarem entrar no
  relatório em PDF um dia (ver como `gerarSvgPerfilPoco` foi reaproveitado
  do zero pro PDF na Fase 4). A escala do eixo se ajusta aos dados (não é
  papel semilog de hidrogeologia, é só um gráfico de dispersão comum) — o
  público daqui é o técnico de campo, não quem faz análise de Theis.
- **Rebaixamento×tempo sempre aparece (quando há leitura); vazão×
  rebaixamento só aparece se alguma leitura tiver vazão lançada** — pra não
  mostrar um gráfico vazio/sem sentido em teste contínuo/recuperação, onde
  vazão não é lançada por leitura.
- **Testado com o teste "contínuo" que o seed já cria pra PT-01** (6
  leituras de 1 a 360 minutos, todas vazão 3,200): confirma o encadeamento
  por tempo rejeitando uma leitura fora de ordem (tentei lançar 15min com
  360min já cadastrado — rejeitado com a mensagem certa) e, trocando o
  tipo pra escalonado e lançando leituras depois dos 360min existentes, os
  dois gráficos (incluindo a curva vazão×rebaixamento subindo nos estágios
  novos) renderizaram corretamente.

Ver `plano-sistema-relatorios-pocos.md`, seção 3, para a lista completa.
Cada fase é implementada e revisada antes de avançar para a próxima —
não adiante trabalho de uma fase futura sem que tenha sido pedido.
