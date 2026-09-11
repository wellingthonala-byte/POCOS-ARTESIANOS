"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { TipoPessoa } from "@/generated/prisma/enums";
import type { EstadoFormularioCliente } from "@/app/clientes/acoes";

const classeCampo =
  "min-h-11 w-full rounded-md border border-gray-300 px-3 text-base";

type ValoresCliente = {
  nome: string;
  tipoPessoa: string;
  documento: string;
  telefone: string;
  email: string;
  endereco: string;
  municipio: string;
  uf: string;
};

const valoresPadrao: ValoresCliente = {
  nome: "",
  tipoPessoa: TipoPessoa.fisica,
  documento: "",
  telefone: "",
  email: "",
  endereco: "",
  municipio: "",
  uf: "",
};

export function FormularioCliente({
  valoresIniciais,
  acao,
}: {
  valoresIniciais?: Partial<ValoresCliente> & { id?: string };
  acao: (
    estado: EstadoFormularioCliente,
    formData: FormData
  ) => Promise<EstadoFormularioCliente>;
}) {
  const router = useRouter();
  const [estado, executarAcao, emAndamento] = useActionState(acao, {});
  const [versaoFormulario, setVersaoFormulario] = useState(0);

  useEffect(() => {
    if (estado.sucesso) {
      router.push("/clientes");
      return;
    }
    if (estado.erro) {
      setVersaoFormulario((v) => v + 1);
    }
  }, [estado, router]);

  const valores = { ...valoresPadrao, ...valoresIniciais };

  return (
    <form
      key={versaoFormulario}
      action={executarAcao}
      className="flex flex-col gap-5"
    >
      <Campo rotulo="Nome" obrigatorio>
        <input
          name="nome"
          defaultValue={valores.nome}
          required
          className={classeCampo}
        />
      </Campo>

      <Campo rotulo="Tipo de pessoa">
        <select
          name="tipoPessoa"
          defaultValue={valores.tipoPessoa}
          className={classeCampo}
        >
          <option value="fisica">Física</option>
          <option value="juridica">Jurídica</option>
        </select>
      </Campo>

      <Campo rotulo="CPF ou CNPJ" obrigatorio>
        <input
          name="documento"
          defaultValue={valores.documento}
          required
          className={classeCampo}
        />
      </Campo>

      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Telefone">
          <input
            name="telefone"
            defaultValue={valores.telefone}
            className={classeCampo}
          />
        </Campo>
        <Campo rotulo="E-mail">
          <input
            name="email"
            type="email"
            defaultValue={valores.email}
            className={classeCampo}
          />
        </Campo>
      </div>

      <Campo rotulo="Endereço">
        <input
          name="endereco"
          defaultValue={valores.endereco}
          className={classeCampo}
        />
      </Campo>

      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Município">
          <input
            name="municipio"
            defaultValue={valores.municipio}
            className={classeCampo}
          />
        </Campo>
        <Campo rotulo="UF">
          <input
            name="uf"
            defaultValue={valores.uf}
            maxLength={2}
            className={classeCampo}
          />
        </Campo>
      </div>

      {estado.erro && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
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
