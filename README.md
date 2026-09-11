# Sistema de Relatórios de Poços

Sistema web para gestão da execução de poços tubulares e geração do relatório
técnico exigido para outorga em órgãos estaduais e cadastro no SIAGAS/CPRM,
seguindo a NBR 12212 (projeto) e a NBR 12244 (construção).

Veja `CLAUDE.md` para stack, convenções de código e glossário do domínio, e
`plano-sistema-relatorios-pocos.md` para a visão de produto e o modelo de
dados completo.

## Como rodar

Pré-requisito: um banco PostgreSQL acessível via `DATABASE_URL` (veja
`.env`). Em desenvolvimento, `npx prisma dev` sobe um Postgres local
descartável sem precisar instalar nada.

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — ambiente de desenvolvimento (Turbopack)
- `npm run build` — build de produção
- `npm run start` — sobe o build de produção
- `npm run lint` — checagem de lint
- `npx prisma generate` — gera o cliente Prisma a partir de `prisma/schema.prisma`
- `npx prisma migrate dev` — aplica migrations pendentes (e roda o seed, se o
  banco acabou de ser criado)
- `npx prisma db seed` — popula o banco com 1 cliente, 1 obra e 2 poços de
  exemplo (`prisma/seed.ts`)
