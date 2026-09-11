"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { atualizarNiveisVazao } from "@/app/pocos/acoes";
import { useAutosavePoco } from "@/hooks/usar-autosave-poco";

type ValoresNiveisVazao = {
  nivelEstatico: string;
  nivelDinamicoEstabilizado: string;
  vazaoEstabilizada: string;
};

const classeCampo =
  "min-h-11 w-full rounded-md border border-gray-300 px-3 text-base";

function paraNumero(texto: string): number | null {
  const valor = Number(texto.trim().replace(",", "."));
  return texto.trim() && !Number.isNaN(valor) ? valor : null;
}

export function FormularioNiveisVazao({
  pocoId,
  valoresIniciais,
  proximaEtapaUrl,
}: {
  pocoId: string;
  valoresIniciais: ValoresNiveisVazao;
  proximaEtapaUrl: string;
}) {
  const router = useRouter();
  const { valores, atualizarCampo, salvar, emAndamento, status, mensagemErro } =
    useAutosavePoco(valoresIniciais, atualizarNiveisVazao.bind(null, pocoId), {
      pocoId,
      tipo: "niveisVazao.atualizar",
    });

  const vazaoEspecifica = useMemo(() => {
    const estatico = paraNumero(valores.nivelEstatico);
    const dinamico = paraNumero(valores.nivelDinamicoEstabilizado);
    const vazao = paraNumero(valores.vazaoEstabilizada);
    if (estatico === null || dinamico === null || vazao === null) return null;
    const rebaixamento = dinamico - estatico;
    if (rebaixamento <= 0) return null;
    return vazao / rebaixamento;
  }, [valores]);

  function salvarEContinuar() {
    salvar(valores, () => router.push(proximaEtapaUrl));
  }

  return (
    <div className="flex flex-col gap-5">
      <Campo rotulo="Nível estático (m)">
        <input
          value={valores.nivelEstatico}
          onChange={(e) => atualizarCampo("nivelEstatico", e.target.value)}
          inputMode="decimal"
          placeholder="Ex.: 8.50"
          className={classeCampo}
        />
      </Campo>

      <Campo rotulo="Nível dinâmico estabilizado (m)">
        <input
          value={valores.nivelDinamicoEstabilizado}
          onChange={(e) =>
            atualizarCampo("nivelDinamicoEstabilizado", e.target.value)
          }
          inputMode="decimal"
          placeholder="Ex.: 14.20"
          className={classeCampo}
        />
      </Campo>

      <Campo rotulo="Vazão estabilizada (m³/h)">
        <input
          value={valores.vazaoEstabilizada}
          onChange={(e) => atualizarCampo("vazaoEstabilizada", e.target.value)}
          inputMode="decimal"
          placeholder="Ex.: 3.200"
          className={classeCampo}
        />
      </Campo>

      <div className="rounded-lg border border-gray-200 p-4">
        <span className="text-sm font-medium text-gray-700">
          Vazão específica (calculada)
        </span>
        <p className="text-2xl font-semibold">
          {vazaoEspecifica !== null
            ? `${vazaoEspecifica.toFixed(3)} m³/h/m`
            : "—"}
        </p>
      </div>

      <p aria-live="polite" className="min-h-5 text-sm text-gray-500">
        {emAndamento
          ? "Salvando..."
          : status === "salvo"
            ? "Alterações salvas."
            : status === "pendente"
              ? "Sem conexão — guardado neste aparelho, será enviado quando a internet voltar."
              : ""}
      </p>

      {mensagemErro && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {mensagemErro}
        </p>
      )}

      <button
        type="button"
        onClick={salvarEContinuar}
        disabled={emAndamento}
        className="min-h-11 rounded-md bg-blue-600 px-4 text-lg font-semibold text-white active:bg-blue-700 disabled:opacity-60"
      >
        {emAndamento ? "Salvando..." : "Salvar e concluir"}
      </button>
    </div>
  );
}

function Campo({
  rotulo,
  children,
}: {
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-gray-700">{rotulo}</span>
      {children}
    </label>
  );
}
