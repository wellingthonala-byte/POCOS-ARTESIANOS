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
em todos os ambientes**: em desenvolvimento local, via `npx prisma dev`
(Postgres local descartável, sem instalação) ou um Postgres via Docker. Se
isso for um problema (ex.: exigência de trabalhar 100% offline até no
desenvolvimento), converse com o time antes da Fase 1 — a alternativa exigiria
manter dois schemas Prisma sincronizados manualmente.

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
  app/                 # Rotas do App Router (páginas e layouts)
  lib/
    prisma.ts          # Cliente Prisma singleton (com driver adapter)
  generated/prisma/     # Código gerado pelo Prisma — NUNCA editar à mão
prisma/
  schema.prisma         # Schema do banco (entidades entram na Fase 1)
prisma7.config.ts        # Configuração do Prisma CLI (datasource, migrations)
plano-sistema-relatorios-pocos.md  # Plano de produto e modelo de dados
```

`src/components/` e `src/types/` serão criados nas próximas fases, junto com
o código que de fato os ocupa — pastas vazias sem conteúdo não entram no
repositório.

## Fases do projeto

Ver `plano-sistema-relatorios-pocos.md`, seção 3, para a lista completa.
Cada fase é implementada e revisada antes de avançar para a próxima —
não adiante trabalho de uma fase futura sem que tenha sido pedido.
