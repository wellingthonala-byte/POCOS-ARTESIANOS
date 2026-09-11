"use client";

import { useActionState, useEffect, useMemo, useRef } from "react";
import {
  adicionarParametro,
  removerParametro,
  type EstadoAnalise,
} from "@/app/pocos/acoes";
import { envolverAcaoSemFila } from "@/lib/offline/envolver-acao";

const classeCampo =
  "min-h-11 w-full rounded-md border border-gray-300 px-3 text-base";

const sugestoesParametros = [
  "pH",
  "Cor aparente",
  "Turbidez",
  "Cloro residual livre",
  "Coliformes totais",
  "Escherichia coli",
  "Ferro total",
  "Manganês",
  "Nitrato",
  "Nitrito",
  "Sulfato",
  "Cloreto",
  "Sólidos dissolvidos totais",
  "Dureza total",
  "Flúor",
];

export type ParametroLista = {
  id: string;
  nome: string;
  valor: number;
  unidade: string;
  vmpMinimo: number | null;
  vmpMaximo: number | null;
};

function foraDoPadrao(parametro: ParametroLista): boolean {
  if (parametro.vmpMinimo !== null && parametro.valor < parametro.vmpMinimo) return true;
  if (parametro.vmpMaximo !== null && parametro.valor > parametro.vmpMaximo) return true;
  return false;
}

function LinhaParametro({
  pocoId,
  analiseId,
  parametro,
}: {
  pocoId: string;
  analiseId: string;
  parametro: ParametroLista;
}) {
  const acaoRemover = useMemo(
    () =>
      envolverAcaoSemFila<EstadoAnalise>(
        removerParametro.bind(null, parametro.id, pocoId, analiseId)
      ),
    [parametro.id, pocoId, analiseId]
  );
  const [estado, executar, removendo] = useActionState(acaoRemover, {});
  const foraPadrao = foraDoPadrao(parametro);

  return (
    <li
      className={`rounded-lg border p-3 ${foraPadrao ? "border-red-300 bg-red-50" : "border-gray-200"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">{parametro.nome}</span>
        {foraPadrao && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
            Fora do padrão
          </span>
        )}
      </div>
      <p className="text-sm text-gray-600">
        {parametro.valor} {parametro.unidade}
        {(parametro.vmpMinimo !== null || parametro.vmpMaximo !== null) && (
          <>
            {" "}
            — VMP: {parametro.vmpMinimo ?? "—"} a {parametro.vmpMaximo ?? "—"}
          </>
        )}
      </p>

      {estado.erro && (
        <p className="mt-1 text-sm text-red-700">{estado.erro}</p>
      )}

      <form action={executar}>
        <button
          type="submit"
          disabled={removendo}
          className="mt-1 min-h-11 rounded-md px-3 text-sm font-medium text-red-600 active:bg-red-50 disabled:opacity-60"
        >
          {removendo ? "Removendo..." : "Remover"}
        </button>
      </form>
    </li>
  );
}

export function ListaParametros({
  pocoId,
  analiseId,
  parametros,
}: {
  pocoId: string;
  analiseId: string;
  parametros: ParametroLista[];
}) {
  const acaoAdicionar = useMemo(
    () =>
      envolverAcaoSemFila<EstadoAnalise>(adicionarParametro.bind(null, analiseId, pocoId)),
    [analiseId, pocoId]
  );
  const [estadoAdicionar, executarAdicionar, adicionando] = useActionState(
    acaoAdicionar,
    {}
  );
  const formularioRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estadoAdicionar.sucesso) {
      formularioRef.current?.reset();
    }
  }, [estadoAdicionar]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="mb-2 font-medium">Parâmetros</h3>

        {parametros.length === 0 ? (
          <p className="text-gray-500">Nenhum parâmetro lançado ainda.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {parametros.map((parametro) => (
              <LinhaParametro
                key={parametro.id}
                pocoId={pocoId}
                analiseId={analiseId}
                parametro={parametro}
              />
            ))}
          </ul>
        )}
      </div>

      <form
        ref={formularioRef}
        action={executarAdicionar}
        className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4"
      >
        <h3 className="font-medium">Adicionar parâmetro</h3>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">
            Nome <span className="text-red-600">*</span>
          </span>
          <input
            name="nome"
            required
            list="sugestoes-parametros"
            placeholder="Ex.: Ferro total"
            className={classeCampo}
          />
          <datalist id="sugestoes-parametros">
            {sugestoesParametros.map((sugestao) => (
              <option key={sugestao} value={sugestao} />
            ))}
          </datalist>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">
              Valor <span className="text-red-600">*</span>
            </span>
            <input
              name="valor"
              required
              inputMode="decimal"
              placeholder="Ex.: 0.35"
              className={classeCampo}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">
              Unidade <span className="text-red-600">*</span>
            </span>
            <input
              name="unidade"
              required
              placeholder="Ex.: mg/L"
              className={classeCampo}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">VMP mínimo</span>
            <input
              name="vmpMinimo"
              inputMode="decimal"
              placeholder="Opcional"
              className={classeCampo}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">VMP máximo</span>
            <input
              name="vmpMaximo"
              inputMode="decimal"
              placeholder="Ex.: 0.30"
              className={classeCampo}
            />
          </label>
        </div>

        {estadoAdicionar.erro && (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {estadoAdicionar.erro}
          </p>
        )}

        <button
          type="submit"
          disabled={adicionando}
          className="min-h-11 rounded-md bg-blue-600 px-4 text-lg font-semibold text-white active:bg-blue-700 disabled:opacity-60"
        >
          {adicionando ? "Adicionando..." : "Adicionar parâmetro"}
        </button>
      </form>
    </div>
  );
}
