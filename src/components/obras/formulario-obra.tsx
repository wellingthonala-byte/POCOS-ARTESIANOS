"use client";

import { useActionState, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { excluirObra, type EstadoFormularioObra } from "@/app/obras/acoes";

const classeCampo =
  "min-h-11 w-full rounded-sm border border-gray-300 bg-white px-3 text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30";

type Cliente = { id: string; nome: string };

type ValoresObra = {
  clienteId: string;
  nome: string;
  endereco: string;
  municipio: string;
  uf: string;
};

const valoresPadrao: ValoresObra = {
  clienteId: "",
  nome: "",
  endereco: "",
  municipio: "",
  uf: "",
};

export function FormularioObra({
  clientes,
  valoresIniciais,
  acao,
}: {
  clientes: Cliente[];
  valoresIniciais?: Partial<ValoresObra> & { id?: string };
  acao: (
    estado: EstadoFormularioObra,
    formData: FormData
  ) => Promise<EstadoFormularioObra>;
}) {
  const router = useRouter();
  const [estado, executarAcao, emAndamento] = useActionState(acao, {});
  const [versaoFormulario, setVersaoFormulario] = useState(0);

  useEffect(() => {
    if (estado.sucesso) {
      router.push("/obras");
      return;
    }
    if (estado.erro) {
      setVersaoFormulario((v) => v + 1);
    }
  }, [estado, router]);

  const valores = { ...valoresPadrao, ...valoresIniciais };

  return (
    <div className="flex flex-col gap-5">
      <form
        key={versaoFormulario}
        action={executarAcao}
        className="flex flex-col gap-5"
      >
        <Campo rotulo="Cliente" obrigatorio>
          <select
            name="clienteId"
            defaultValue={valores.clienteId}
            required
            className={classeCampo}
          >
            <option value="" disabled>
              Selecione o cliente
            </option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nome}
              </option>
            ))}
          </select>
        </Campo>

        <Campo rotulo="Nome da obra" obrigatorio>
          <input
            name="nome"
            defaultValue={valores.nome}
            required
            placeholder="Ex.: Captação de água — Sede"
            className={classeCampo}
          />
        </Campo>

        <Campo rotulo="Endereço">
          <input
            name="endereco"
            defaultValue={valores.endereco}
            className={classeCampo}
          />
        </Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Município" obrigatorio>
            <input
              name="municipio"
              defaultValue={valores.municipio}
              required
              className={classeCampo}
            />
          </Campo>
          <Campo rotulo="UF" obrigatorio>
            <input
              name="uf"
              defaultValue={valores.uf}
              required
              maxLength={2}
              className={classeCampo}
            />
          </Campo>
        </div>

        {estado.erro && (
          <p className="rounded-sm bg-red-50 p-3 text-sm text-red-700">
            {estado.erro}
          </p>
        )}

        <button
          type="submit"
          disabled={emAndamento}
          className="min-h-11 rounded-md bg-blue-600 px-4 text-lg font-semibold text-white active:bg-blue-700 disabled:opacity-60"
        >
          {emAndamento ? "Salvando..." : "Salvar"}
        </button>
      </form>

      {valoresIniciais?.id && <ExcluirObra obraId={valoresIniciais.id} />}
    </div>
  );
}

// Exclusão só faz sentido editando uma obra já existente (nunca na
// criação) — form separado, renderizado condicionalmente, mesma
// convenção de FormularioCliente. Sem sucesso a tratar aqui: quando dá
// certo, a própria action redireciona pro servidor (ver excluirObra em
// obras/acoes.ts) — só o erro de bloqueio (obra com poço vinculado) chega
// de volta pra esse estado.
function ExcluirObra({ obraId }: { obraId: string }) {
  const acao = useMemo(() => excluirObra.bind(null, obraId), [obraId]);
  const [estado, executarAcao, excluindo] = useActionState(acao, {});

  return (
    <div className="border-t border-gray-200 pt-4">
      {estado.erro && (
        <p className="mb-2 rounded-sm bg-red-50 p-3 text-sm text-red-700">
          {estado.erro}
        </p>
      )}
      <form
        action={executarAcao}
        onSubmit={(evento) => {
          if (!confirm("Excluir esta obra?")) {
            evento.preventDefault();
          }
        }}
      >
        <button
          type="submit"
          disabled={excluindo}
          className="min-h-11 w-full rounded-md px-4 text-sm font-medium text-red-600 active:bg-red-50 disabled:opacity-60"
        >
          {excluindo ? "Excluindo..." : "Excluir obra"}
        </button>
      </form>
    </div>
  );
}

function Campo({
  rotulo,
  obrigatorio,
  children,
}: {
  rotulo: string;
  obrigatorio?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-gray-700">
        {rotulo}
        {obrigatorio && <span className="text-red-600"> *</span>}
      </span>
      {children}
    </label>
  );
}
