"use client";

import { useRouter } from "next/navigation";
import {
  adicionarRevestimento,
  removerUltimoRevestimento,
  adicionarCimentacao,
  removerUltimaCimentacao,
  adicionarPreFiltro,
  removerUltimoPreFiltro,
} from "@/app/pocos/acoes";
import { useListaTrechos } from "@/hooks/usar-lista-trechos";
import { rotulosTipoRevestimento } from "@/lib/rotulos";

const classeCampo =
  "min-h-11 w-full rounded-md border border-gray-300 px-3 text-base";

type TrechoRevestimento = {
  id: string;
  profundidadeInicial: string;
  profundidadeFinal: string;
  tipo: string;
  material: string | null;
  diametro: string;
};

type TrechoSimples = {
  id: string;
  profundidadeInicial: string;
  profundidadeFinal: string;
  detalhe: string | null;
};

export function FormularioConstrutivo({
  pocoId,
  revestimentos,
  cimentacoes,
  preFiltros,
  proximaEtapaUrl,
}: {
  pocoId: string;
  revestimentos: TrechoRevestimento[];
  cimentacoes: TrechoSimples[];
  preFiltros: TrechoSimples[];
  proximaEtapaUrl: string;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-8">
      <SecaoRevestimento pocoId={pocoId} trechos={revestimentos} />
      <SecaoCimentacao pocoId={pocoId} trechos={cimentacoes} />
      <SecaoPreFiltro pocoId={pocoId} trechos={preFiltros} />

      <button
        type="button"
        onClick={() => router.push(proximaEtapaUrl)}
        className="min-h-11 rounded-md bg-gray-100 px-4 text-lg font-semibold text-gray-700 active:bg-gray-200"
      >
        Concluir construtivo
      </button>
    </div>
  );
}

function SecaoRevestimento({
  pocoId,
  trechos,
}: {
  pocoId: string;
  trechos: TrechoRevestimento[];
}) {
  const ultimo = trechos[trechos.length - 1];
  const profundidadeInicialProxima = ultimo ? ultimo.profundidadeFinal : "0.00";

  const {
    estadoAdicionar,
    adicionar,
    adicionando,
    estadoRemover,
    remover,
    removendo,
    formularioRef,
    primeiroCampoRef,
  } = useListaTrechos(
    adicionarRevestimento.bind(null, pocoId),
    removerUltimoRevestimento.bind(null, pocoId),
    {}
  );

  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold">Revestimento</h2>

      {trechos.length === 0 ? (
        <p className="text-gray-500">Nenhum trecho lançado ainda.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {trechos.map((trecho, indice) => (
            <li
              key={trecho.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-3"
            >
              <span>
                <strong>
                  {trecho.profundidadeInicial}–{trecho.profundidadeFinal} m
                </strong>{" "}
                {rotulosTipoRevestimento[trecho.tipo]} — {trecho.diametro}
                {trecho.material ? ` — ${trecho.material}` : ""}
              </span>
              {indice === trechos.length - 1 && (
                <form action={remover}>
                  <button
                    type="submit"
                    disabled={removendo}
                    className="min-h-11 shrink-0 rounded-md px-3 text-sm font-medium text-red-600 active:bg-red-50 disabled:opacity-60"
                  >
                    Remover
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}

      {estadoRemover.erro && (
        <p className="mt-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {estadoRemover.erro}
        </p>
      )}

      <form
        ref={formularioRef}
        action={adicionar}
        className="mt-3 flex flex-col gap-3 rounded-lg border border-gray-200 p-4"
      >
        <h3 className="font-medium">Adicionar trecho</h3>
        <p className="text-sm text-gray-500">
          Profundidade inicial (calculada): {profundidadeInicialProxima} m
        </p>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">
            Profundidade final (m) <span className="text-red-600">*</span>
          </span>
          <input
            ref={primeiroCampoRef}
            name="profundidadeFinal"
            required
            inputMode="decimal"
            placeholder="Ex.: 42.00"
            className={classeCampo}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">
            Tipo <span className="text-red-600">*</span>
          </span>
          <select name="tipo" required defaultValue="liso" className={classeCampo}>
            <option value="liso">Liso</option>
            <option value="filtro">Filtro</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">
            Diâmetro <span className="text-red-600">*</span>
          </span>
          <input
            name="diametro"
            required
            placeholder={'Ex.: 6" ou 8 5/8"'}
            className={classeCampo}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">Material</span>
          <input
            name="material"
            placeholder="Ex.: PVC geomecânico"
            className={classeCampo}
          />
        </label>

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
          {adicionando ? "Adicionando..." : "Adicionar trecho"}
        </button>
      </form>
    </div>
  );
}

function SecaoCimentacao({
  pocoId,
  trechos,
}: {
  pocoId: string;
  trechos: TrechoSimples[];
}) {
  const ultimo = trechos[trechos.length - 1];
  const profundidadeInicialProxima = ultimo ? ultimo.profundidadeFinal : "0.00";

  const {
    estadoAdicionar,
    adicionar,
    adicionando,
    estadoRemover,
    remover,
    removendo,
    formularioRef,
    primeiroCampoRef,
  } = useListaTrechos(
    adicionarCimentacao.bind(null, pocoId),
    removerUltimaCimentacao.bind(null, pocoId),
    {}
  );

  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold">Cimentação</h2>

      {trechos.length === 0 ? (
        <p className="text-gray-500">Nenhum trecho lançado ainda.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {trechos.map((trecho, indice) => (
            <li
              key={trecho.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-3"
            >
              <span>
                <strong>
                  {trecho.profundidadeInicial}–{trecho.profundidadeFinal} m
                </strong>
              </span>
              {indice === trechos.length - 1 && (
                <form action={remover}>
                  <button
                    type="submit"
                    disabled={removendo}
                    className="min-h-11 shrink-0 rounded-md px-3 text-sm font-medium text-red-600 active:bg-red-50 disabled:opacity-60"
                  >
                    Remover
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}

      {estadoRemover.erro && (
        <p className="mt-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {estadoRemover.erro}
        </p>
      )}

      <form
        ref={formularioRef}
        action={adicionar}
        className="mt-3 flex flex-col gap-3 rounded-lg border border-gray-200 p-4"
      >
        <h3 className="font-medium">Adicionar trecho</h3>
        <p className="text-sm text-gray-500">
          Profundidade inicial (calculada): {profundidadeInicialProxima} m
        </p>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">
            Profundidade final (m) <span className="text-red-600">*</span>
          </span>
          <input
            ref={primeiroCampoRef}
            name="profundidadeFinal"
            required
            inputMode="decimal"
            placeholder="Ex.: 6.00"
            className={classeCampo}
          />
        </label>

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
          {adicionando ? "Adicionando..." : "Adicionar trecho"}
        </button>
      </form>
    </div>
  );
}

function SecaoPreFiltro({
  pocoId,
  trechos,
}: {
  pocoId: string;
  trechos: TrechoSimples[];
}) {
  const ultimo = trechos[trechos.length - 1];
  const profundidadeInicialProxima = ultimo ? ultimo.profundidadeFinal : "0.00";

  const {
    estadoAdicionar,
    adicionar,
    adicionando,
    estadoRemover,
    remover,
    removendo,
    formularioRef,
    primeiroCampoRef,
  } = useListaTrechos(
    adicionarPreFiltro.bind(null, pocoId),
    removerUltimoPreFiltro.bind(null, pocoId),
    {}
  );

  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold">Pré-filtro</h2>

      {trechos.length === 0 ? (
        <p className="text-gray-500">Nenhum trecho lançado ainda.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {trechos.map((trecho, indice) => (
            <li
              key={trecho.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-3"
            >
              <span>
                <strong>
                  {trecho.profundidadeInicial}–{trecho.profundidadeFinal} m
                </strong>
                {trecho.detalhe ? ` — ${trecho.detalhe}` : ""}
              </span>
              {indice === trechos.length - 1 && (
                <form action={remover}>
                  <button
                    type="submit"
                    disabled={removendo}
                    className="min-h-11 shrink-0 rounded-md px-3 text-sm font-medium text-red-600 active:bg-red-50 disabled:opacity-60"
                  >
                    Remover
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}

      {estadoRemover.erro && (
        <p className="mt-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {estadoRemover.erro}
        </p>
      )}

      <form
        ref={formularioRef}
        action={adicionar}
        className="mt-3 flex flex-col gap-3 rounded-lg border border-gray-200 p-4"
      >
        <h3 className="font-medium">Adicionar trecho</h3>
        <p className="text-sm text-gray-500">
          Profundidade inicial (calculada): {profundidadeInicialProxima} m
        </p>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">
            Profundidade final (m) <span className="text-red-600">*</span>
          </span>
          <input
            ref={primeiroCampoRef}
            name="profundidadeFinal"
            required
            inputMode="decimal"
            placeholder="Ex.: 59.00"
            className={classeCampo}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">
            Granulometria
          </span>
          <input
            name="granulometria"
            placeholder="Ex.: 1-2mm"
            className={classeCampo}
          />
        </label>

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
          {adicionando ? "Adicionando..." : "Adicionar trecho"}
        </button>
      </form>
    </div>
  );
}
