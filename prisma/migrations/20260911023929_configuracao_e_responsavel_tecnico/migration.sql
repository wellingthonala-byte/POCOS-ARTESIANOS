-- AlterTable
ALTER TABLE "poco" ADD COLUMN     "responsavel_tecnico_id" TEXT;

-- CreateTable
CREATE TABLE "configuracao" (
    "id" TEXT NOT NULL,
    "nome_empresa" TEXT NOT NULL,
    "logo_url" TEXT,
    "cnpj" TEXT,
    "endereco" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracao_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "poco" ADD CONSTRAINT "poco_responsavel_tecnico_id_fkey" FOREIGN KEY ("responsavel_tecnico_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
