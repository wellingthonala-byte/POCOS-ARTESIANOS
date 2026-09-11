-- CreateTable
CREATE TABLE "conflito_edicao" (
    "id" TEXT NOT NULL,
    "poco_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "dados_servidor" JSONB NOT NULL,
    "dados_locais" JSONB NOT NULL,
    "resolvido_em" TIMESTAMP(3),
    "resolvido_por_id" TEXT,
    "criado_por_id" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "excluido_em" TIMESTAMP(3),

    CONSTRAINT "conflito_edicao_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "conflito_edicao" ADD CONSTRAINT "conflito_edicao_poco_id_fkey" FOREIGN KEY ("poco_id") REFERENCES "poco"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conflito_edicao" ADD CONSTRAINT "conflito_edicao_resolvido_por_id_fkey" FOREIGN KEY ("resolvido_por_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conflito_edicao" ADD CONSTRAINT "conflito_edicao_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
