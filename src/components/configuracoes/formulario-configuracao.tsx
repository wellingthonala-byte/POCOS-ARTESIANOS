"use client";

import { useActionState, type ReactNode } from "react";
import { atualizarConfiguracao } from "@/app/configuracoes/acoes";

const classeCampo =
  "min-h-11 w-full rounded-sm border border-gray-300 bg-white px-3 text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30";

type ValoresConfiguracao = {
  nomeEmpresa: string;
  logoUrl: string;
  cnpj: string;
  endereco: string;
  telefone: string;
  email: string;
};

export function FormularioConfiguracao({
  valoresIniciais,
}: {
  valoresIniciais: ValoresConfiguracao;
}) {
  const [estado, executarAcao, emAndamento] = useActionState(
    atualizarConfiguracao,
    {}
  );

  return (
    <form action={executarAcao} className="flex flex-col gap-5">
      <Campo rotulo="Nome da empresa" obrigatorio>
        <input
          name="nomeEmpresa"
          defaultValue={valoresIniciais.nomeEmpresa}
          required
          className={classeCampo}
        />
      </Campo>

      <Campo rotulo="CNPJ">
        <input
          name="cnpj"
          defaultValue={valoresIniciais.cnpj}
          className={classeCampo}
        />
      </Campo>

      <Campo rotulo="Logo (URL da imagem)">
        <input
          name="logoUrl"
          defaultValue={valoresIniciais.logoUrl}
          placeholder="https://.../logo.png"
          className={classeCampo}
        />
      </Campo>

      <Campo rotulo="Endereço">
        <input
          name="endereco"
          defaultValue={valoresIniciais.endereco}
          className={classeCampo}
        />
      </Campo>

      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Telefone">
          <input
            name="telefone"
            defaultValue={valoresIniciais.telefone}
            className={classeCampo}
          />
        </Campo>
        <Campo rotulo="E-mail">
          <input
            name="email"
            type="email"
            defaultValue={valoresIniciais.email}
            className={classeCampo}
          />
        </Campo>
      </div>

      {estado.erro && (
        <p className="rounded-sm bg-red-50 p-3 text-sm text-red-700">
          {estado.erro}
        </p>
      )}
      {estado.sucesso && (
        <p className="rounded-md bg-green-50 p-3 text-sm text-green-700">
          Configurações salvas.
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
