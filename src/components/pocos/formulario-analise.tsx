"use client";

import { useActionState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { atualizarAnalise, excluirAnalise, type EstadoAnalise } from "@/app/pocos/acoes";
import { envolverAcaoSemFila } from "@/lib/offline/envolver-acao";

const classeCampo =
  "min-h-11 w-full rounded-md border border-gray-300 px-3 text-base";

export function FormularioAnalise({
  pocoId,
  analiseId,
  dataColetaInicial,
  laboratorioInicial,
}: {
  pocoId: string;
  analiseId: string;
  dataColetaInicial: string;
  laboratorioInicial: string;
}) {
  const router = useRouter();

  const acaoAtualizar = useMemo(
    () => envolverAcaoSemFila<EstadoAnalise>(atualizarAnalise.bind(null, analiseId, pocoId)),
    [analiseId, pocoId]
  );
  const [estadoAtualizar, executarAtualizar, salvando] = useActionState(acaoAtualizar, {});

  const acaoExcluir = useMemo(
    () => envolverAcaoSemFila<EstadoAnalise>(excluirAnalise.bind(null, analiseId, pocoId)),
    [analiseId, pocoId]
  );
  const [estadoExcluir, executarExcluir, excluindo] = useActionState(acaoExcluir, {});

  useEffect(() => {
    if (estadoExcluir.sucesso) {
      router.push(`/pocos/${pocoId}/analises`);
    }
  }, [estadoExcluir, pocoId, router]);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4">
      <form action={executarAtualizar} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">
            Data da coleta <span className="text-red-600">*</span>
          </span>
          <input
            type="date"
            name="dataColeta"
            required
            defaultValue={dataColetaInicial}
            className={classeCampo}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">Laboratório</span>
          <input
            name="laboratorio"
            defaultValue={laboratorioInicial}
            placeholder="Ex.: Laboratório Central Ltda"
            className={classeCampo}
          />
        </label>

        {estadoAtualizar.erro && (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {estadoAtualizar.erro}
          </p>
        )}

        <button
          type="submit"
          disabled={salvando}
          className="min-h-11 rounded-md bg-gray-100 px-4 text-sm font-medium text-gray-700 active:bg-gray-200 disabled:opacity-60"
        >
          {salvando ? "Salvando..." : "Salvar"}
        </button>
      </form>

      <form
        action={executarExcluir}
        onSubmit={(evento) => {
          if (!confirm("Excluir esta análise e todos os parâmetros lançados nela?")) {
            evento.preventDefault();
          }
        }}
      >
        {estadoExcluir.erro && (
          <p className="mb-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {estadoExcluir.erro}
          </p>
        )}
        <button
          type="submit"
          disabled={excluindo}
          className="min-h-11 w-full rounded-md px-4 text-sm font-medium text-red-600 active:bg-red-50 disabled:opacity-60"
        >
          {excluindo ? "Excluindo..." : "Excluir análise"}
        </button>
      </form>
    </div>
  );
}
