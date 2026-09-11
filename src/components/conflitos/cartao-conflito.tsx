"use client";

import { useState, useTransition } from "react";
import { resolverConflito } from "@/app/conflitos/acoes";
import { rotulosTipoConflito, rotulosCamposConflito } from "@/lib/rotulos";

export type ConflitoParaCartao = {
  id: string;
  tipo: string;
  pocoIdentificacao: string;
  criadoPorNome: string;
  criadoEmTexto: string;
  dadosServidor: Record<string, unknown>;
  dadosLocais: Record<string, unknown>;
};

const PADRAO_DATA_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

function formatarValor(valor: unknown): string {
  if (valor === null || valor === undefined || valor === "") return "—";
  const texto = String(valor);
  if (PADRAO_DATA_ISO.test(texto)) {
    return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(texto));
  }
  return texto;
}

function TabelaCampos({ dados }: { dados: Record<string, unknown> }) {
  return (
    <dl className="flex flex-col gap-1 text-sm">
      {Object.entries(dados).map(([campo, valor]) => (
        <div key={campo} className="flex justify-between gap-2">
          <dt className="text-gray-500">{rotulosCamposConflito[campo] ?? campo}</dt>
          <dd className="text-right font-medium">{formatarValor(valor)}</dd>
        </div>
      ))}
    </dl>
  );
}

export function CartaoConflito({ conflito }: { conflito: ConflitoParaCartao }) {
  const [pendente, iniciarTransicao] = useTransition();
  const [resolvido, setResolvido] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function resolver(resolucao: "manter_servidor" | "aplicar_local") {
    setErro(null);
    iniciarTransicao(async () => {
      const resultado = await resolverConflito(conflito.id, resolucao);
      if (resultado.erro) {
        setErro(resultado.erro);
      } else {
        setResolvido(true);
      }
    });
  }

  if (resolvido) {
    return (
      <li className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
        Conflito do poço {conflito.pocoIdentificacao} resolvido.
      </li>
    );
  }

  return (
    <li className="rounded-lg border border-gray-200 p-4">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-lg font-semibold">{conflito.pocoIdentificacao}</span>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
          {rotulosTipoConflito[conflito.tipo] ?? conflito.tipo}
        </span>
      </div>
      <p className="mb-4 text-sm text-gray-500">
        Lançado por {conflito.criadoPorNome} em {conflito.criadoEmTexto}, enquanto
        alguém alterava o mesmo poço.
      </p>

      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <p className="mb-1 text-sm font-semibold">No servidor agora</p>
          <TabelaCampos dados={conflito.dadosServidor} />
        </div>
        <div>
          <p className="mb-1 text-sm font-semibold">Lançado offline</p>
          <TabelaCampos dados={conflito.dadosLocais} />
        </div>
      </div>

      {erro && (
        <p className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{erro}</p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => resolver("manter_servidor")}
          disabled={pendente}
          className="min-h-11 flex-1 rounded-md bg-gray-100 px-4 text-sm font-medium text-gray-700 active:bg-gray-200 disabled:opacity-60"
        >
          Manter dado do servidor
        </button>
        <button
          type="button"
          onClick={() => resolver("aplicar_local")}
          disabled={pendente}
          className="min-h-11 flex-1 rounded-md bg-blue-600 px-4 text-sm font-medium text-white active:bg-blue-700 disabled:opacity-60"
        >
          Aplicar dado lançado offline
        </button>
      </div>
    </li>
  );
}
