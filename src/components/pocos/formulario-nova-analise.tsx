"use client";

import { useActionState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { criarAnalise, type EstadoAnalise } from "@/app/pocos/acoes";
import { envolverAcaoSemFila } from "@/lib/offline/envolver-acao";

const classeCampo =
  "min-h-11 w-full rounded-sm border border-gray-300 bg-white px-3 text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30";

export function FormularioNovaAnalise({ pocoId }: { pocoId: string }) {
  const router = useRouter();
  const acao = useMemo(
    () => envolverAcaoSemFila<EstadoAnalise>(criarAnalise.bind(null, pocoId)),
    [pocoId]
  );
  const [estado, executarAcao, emAndamento] = useActionState(acao, {});

  useEffect(() => {
    if (estado.sucesso && estado.analiseId) {
      router.push(`/pocos/${pocoId}/analises/${estado.analiseId}`);
    }
  }, [estado, pocoId, router]);

  return (
    <form
      action={executarAcao}
      className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4"
    >
      <h3 className="font-medium">Nova análise</h3>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-700">
          Data da coleta <span className="text-red-600">*</span>
        </span>
        <input type="date" name="dataColeta" required className={classeCampo} />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-700">Laboratório</span>
        <input
          name="laboratorio"
          placeholder="Ex.: Laboratório Central Ltda"
          className={classeCampo}
        />
      </label>

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
        {emAndamento ? "Criando..." : "Criar análise"}
      </button>
    </form>
  );
}
