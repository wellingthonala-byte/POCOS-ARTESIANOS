import { prisma } from "@/lib/prisma";
import { FormularioConfiguracao } from "@/components/configuracoes/formulario-configuracao";

export const dynamic = "force-dynamic";

export default async function Configuracoes() {
  const configuracao = await prisma.configuracao.findFirst();

  return (
    <main className="mx-auto max-w-2xl p-4 pb-24 md:max-w-4xl md:p-8">
      <h1 className="mb-1 text-2xl font-bold">Configurações</h1>
      <p className="mb-6 text-gray-500">
        Dados da empresa usados no cabeçalho e na capa dos relatórios.
      </p>
      <FormularioConfiguracao
        valoresIniciais={{
          nomeEmpresa: configuracao?.nomeEmpresa ?? "",
          logoUrl: configuracao?.logoUrl ?? "",
          cnpj: configuracao?.cnpj ?? "",
          endereco: configuracao?.endereco ?? "",
          telefone: configuracao?.telefone ?? "",
          email: configuracao?.email ?? "",
        }}
      />
    </main>
  );
}
