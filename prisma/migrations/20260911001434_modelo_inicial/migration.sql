-- CreateEnum
CREATE TYPE "Papel" AS ENUM ('admin', 'tecnico_campo', 'responsavel_tecnico');

-- CreateEnum
CREATE TYPE "MetodoObtencaoCoordenada" AS ENUM ('gps_celular', 'gps_geodesico', 'manual');

-- CreateEnum
CREATE TYPE "TipoPessoa" AS ENUM ('fisica', 'juridica');

-- CreateEnum
CREATE TYPE "StatusPoco" AS ENUM ('planejado', 'em_perfuracao', 'concluido', 'cancelado');

-- CreateEnum
CREATE TYPE "MetodoPerfuracao" AS ENUM ('rotativo', 'rotopneumatico', 'percussao', 'misto');

-- CreateEnum
CREATE TYPE "TipoRevestimento" AS ENUM ('liso', 'filtro');

-- CreateEnum
CREATE TYPE "MetodoDesenvolvimento" AS ENUM ('pistoneamento', 'ar_comprimido', 'bombeamento', 'jateamento', 'outro');

-- CreateEnum
CREATE TYPE "TipoTesteVazao" AS ENUM ('escalonado', 'continuo', 'recuperacao');

-- CreateEnum
CREATE TYPE "TipoAnexo" AS ENUM ('foto', 'art', 'croqui', 'laudo', 'outro');

-- CreateTable
CREATE TABLE "usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "papel" "Papel" NOT NULL,
    "crea" TEXT,
    "telefone" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_por_id" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "excluido_em" TIMESTAMP(3),
    "sincronizado_em" TIMESTAMP(3),

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cliente" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo_pessoa" "TipoPessoa" NOT NULL,
    "documento" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "endereco" TEXT,
    "municipio" TEXT,
    "uf" TEXT,
    "criado_por_id" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "excluido_em" TIMESTAMP(3),
    "sincronizado_em" TIMESTAMP(3),

    CONSTRAINT "cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "obra" (
    "id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "endereco" TEXT,
    "municipio" TEXT NOT NULL,
    "uf" TEXT NOT NULL,
    "criado_por_id" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "excluido_em" TIMESTAMP(3),
    "sincronizado_em" TIMESTAMP(3),

    CONSTRAINT "obra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poco" (
    "id" TEXT NOT NULL,
    "obra_id" TEXT NOT NULL,
    "identificacao" TEXT NOT NULL,
    "status" "StatusPoco" NOT NULL DEFAULT 'planejado',
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "metodo_obtencao_coordenada" "MetodoObtencaoCoordenada" NOT NULL,
    "municipio" TEXT,
    "uf" TEXT,
    "metodo_perfuracao" "MetodoPerfuracao",
    "data_inicio_perfuracao" TIMESTAMP(3),
    "data_fim_perfuracao" TIMESTAMP(3),
    "profundidade_final" DECIMAL(6,2),
    "numero_art" TEXT,
    "criado_por_id" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "excluido_em" TIMESTAMP(3),
    "sincronizado_em" TIMESTAMP(3),

    CONSTRAINT "poco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "camada_litologica" (
    "id" TEXT NOT NULL,
    "poco_id" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "profundidade_inicial" DECIMAL(6,2) NOT NULL,
    "profundidade_final" DECIMAL(6,2) NOT NULL,
    "descricao" TEXT NOT NULL,
    "criado_por_id" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "excluido_em" TIMESTAMP(3),
    "sincronizado_em" TIMESTAMP(3),

    CONSTRAINT "camada_litologica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revestimento" (
    "id" TEXT NOT NULL,
    "poco_id" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "profundidade_inicial" DECIMAL(6,2) NOT NULL,
    "profundidade_final" DECIMAL(6,2) NOT NULL,
    "tipo" "TipoRevestimento" NOT NULL,
    "material" TEXT,
    "diametro" TEXT NOT NULL,
    "criado_por_id" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "excluido_em" TIMESTAMP(3),
    "sincronizado_em" TIMESTAMP(3),

    CONSTRAINT "revestimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cimentacao" (
    "id" TEXT NOT NULL,
    "poco_id" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "profundidade_inicial" DECIMAL(6,2) NOT NULL,
    "profundidade_final" DECIMAL(6,2) NOT NULL,
    "criado_por_id" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "excluido_em" TIMESTAMP(3),
    "sincronizado_em" TIMESTAMP(3),

    CONSTRAINT "cimentacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pre_filtro" (
    "id" TEXT NOT NULL,
    "poco_id" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "profundidade_inicial" DECIMAL(6,2) NOT NULL,
    "profundidade_final" DECIMAL(6,2) NOT NULL,
    "granulometria" TEXT,
    "criado_por_id" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "excluido_em" TIMESTAMP(3),
    "sincronizado_em" TIMESTAMP(3),

    CONSTRAINT "pre_filtro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "desenvolvimento" (
    "id" TEXT NOT NULL,
    "poco_id" TEXT NOT NULL,
    "metodo" "MetodoDesenvolvimento" NOT NULL,
    "data_inicio" TIMESTAMP(3),
    "data_fim" TIMESTAMP(3),
    "duracao_horas" DECIMAL(6,2),
    "observacoes" TEXT,
    "criado_por_id" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "excluido_em" TIMESTAMP(3),
    "sincronizado_em" TIMESTAMP(3),

    CONSTRAINT "desenvolvimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teste_vazao" (
    "id" TEXT NOT NULL,
    "poco_id" TEXT NOT NULL,
    "tipo" "TipoTesteVazao" NOT NULL,
    "data_hora_inicio" TIMESTAMP(3) NOT NULL,
    "nivel_estatico" DECIMAL(6,2) NOT NULL,
    "vazao_estabilizada" DECIMAL(8,3),
    "observacoes" TEXT,
    "criado_por_id" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "excluido_em" TIMESTAMP(3),
    "sincronizado_em" TIMESTAMP(3),

    CONSTRAINT "teste_vazao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teste_leitura" (
    "id" TEXT NOT NULL,
    "teste_vazao_id" TEXT NOT NULL,
    "tempo_minutos" DECIMAL(7,2) NOT NULL,
    "nivel_dinamico" DECIMAL(6,2) NOT NULL,
    "vazao" DECIMAL(8,3),
    "criado_por_id" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "excluido_em" TIMESTAMP(3),
    "sincronizado_em" TIMESTAMP(3),

    CONSTRAINT "teste_leitura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analise_agua" (
    "id" TEXT NOT NULL,
    "poco_id" TEXT NOT NULL,
    "data_coleta" TIMESTAMP(3) NOT NULL,
    "laboratorio" TEXT,
    "criado_por_id" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "excluido_em" TIMESTAMP(3),
    "sincronizado_em" TIMESTAMP(3),

    CONSTRAINT "analise_agua_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parametro" (
    "id" TEXT NOT NULL,
    "analise_agua_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "valor" DECIMAL(10,4) NOT NULL,
    "unidade" TEXT NOT NULL,
    "vmp_minimo" DECIMAL(10,4),
    "vmp_maximo" DECIMAL(10,4),
    "criado_por_id" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "excluido_em" TIMESTAMP(3),
    "sincronizado_em" TIMESTAMP(3),

    CONSTRAINT "parametro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anexo" (
    "id" TEXT NOT NULL,
    "poco_id" TEXT NOT NULL,
    "analise_agua_id" TEXT,
    "tipo" "TipoAnexo" NOT NULL,
    "arquivo_url" TEXT NOT NULL,
    "nome_arquivo" TEXT NOT NULL,
    "legenda" TEXT,
    "incluir_no_relatorio" BOOLEAN NOT NULL DEFAULT false,
    "criado_por_id" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "excluido_em" TIMESTAMP(3),
    "sincronizado_em" TIMESTAMP(3),

    CONSTRAINT "anexo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "poco_obra_id_identificacao_key" ON "poco"("obra_id", "identificacao");

-- CreateIndex
CREATE UNIQUE INDEX "camada_litologica_poco_id_ordem_key" ON "camada_litologica"("poco_id", "ordem");

-- CreateIndex
CREATE UNIQUE INDEX "revestimento_poco_id_ordem_key" ON "revestimento"("poco_id", "ordem");

-- CreateIndex
CREATE UNIQUE INDEX "cimentacao_poco_id_ordem_key" ON "cimentacao"("poco_id", "ordem");

-- CreateIndex
CREATE UNIQUE INDEX "pre_filtro_poco_id_ordem_key" ON "pre_filtro"("poco_id", "ordem");

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cliente" ADD CONSTRAINT "cliente_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obra" ADD CONSTRAINT "obra_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obra" ADD CONSTRAINT "obra_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poco" ADD CONSTRAINT "poco_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "obra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poco" ADD CONSTRAINT "poco_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "camada_litologica" ADD CONSTRAINT "camada_litologica_poco_id_fkey" FOREIGN KEY ("poco_id") REFERENCES "poco"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "camada_litologica" ADD CONSTRAINT "camada_litologica_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revestimento" ADD CONSTRAINT "revestimento_poco_id_fkey" FOREIGN KEY ("poco_id") REFERENCES "poco"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revestimento" ADD CONSTRAINT "revestimento_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cimentacao" ADD CONSTRAINT "cimentacao_poco_id_fkey" FOREIGN KEY ("poco_id") REFERENCES "poco"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cimentacao" ADD CONSTRAINT "cimentacao_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_filtro" ADD CONSTRAINT "pre_filtro_poco_id_fkey" FOREIGN KEY ("poco_id") REFERENCES "poco"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_filtro" ADD CONSTRAINT "pre_filtro_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "desenvolvimento" ADD CONSTRAINT "desenvolvimento_poco_id_fkey" FOREIGN KEY ("poco_id") REFERENCES "poco"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "desenvolvimento" ADD CONSTRAINT "desenvolvimento_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teste_vazao" ADD CONSTRAINT "teste_vazao_poco_id_fkey" FOREIGN KEY ("poco_id") REFERENCES "poco"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teste_vazao" ADD CONSTRAINT "teste_vazao_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teste_leitura" ADD CONSTRAINT "teste_leitura_teste_vazao_id_fkey" FOREIGN KEY ("teste_vazao_id") REFERENCES "teste_vazao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teste_leitura" ADD CONSTRAINT "teste_leitura_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analise_agua" ADD CONSTRAINT "analise_agua_poco_id_fkey" FOREIGN KEY ("poco_id") REFERENCES "poco"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analise_agua" ADD CONSTRAINT "analise_agua_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parametro" ADD CONSTRAINT "parametro_analise_agua_id_fkey" FOREIGN KEY ("analise_agua_id") REFERENCES "analise_agua"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parametro" ADD CONSTRAINT "parametro_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anexo" ADD CONSTRAINT "anexo_poco_id_fkey" FOREIGN KEY ("poco_id") REFERENCES "poco"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anexo" ADD CONSTRAINT "anexo_analise_agua_id_fkey" FOREIGN KEY ("analise_agua_id") REFERENCES "analise_agua"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anexo" ADD CONSTRAINT "anexo_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
