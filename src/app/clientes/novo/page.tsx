import { FormularioCliente } from "@/components/clientes/formulario-cliente";
import { criarCliente } from "@/app/clientes/acoes";

export const dynamic = "force-dynamic";

export default function NovoCliente() {
  return (
    <main className="mx-auto max-w-2xl p-4 pb-24">
      <h1 className="mb-6 text-2xl font-bold">Novo cliente</h1>
      <FormularioCliente acao={criarCliente} />
    </main>
  );
}
