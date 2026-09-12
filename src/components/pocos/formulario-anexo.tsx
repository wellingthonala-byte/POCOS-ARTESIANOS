"use client";

import { useActionState, useEffect, useMemo, useRef } from "react";
import { adicionarAnexo, type EstadoAnexo } from "@/app/pocos/acoes";
import { envolverAcaoSemFila } from "@/lib/offline/envolver-acao";
import { rotulosTipoAnexo } from "@/lib/rotulos";

const classeCampo =
  "min-h-11 w-full rounded-sm border border-gray-300 bg-white px-3 text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30";

export function FormularioAnexo({ pocoId }: { pocoId: string }) {
  const acao = useMemo(
    () => envolverAcaoSemFila<EstadoAnexo>(adicionarAnexo.bind(null, pocoId)),
    [pocoId]
  );
  const [estado, executarAcao, enviando] = useActionState(acao, {});
  const formularioRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado.sucesso) {
      formularioRef.current?.reset();
    }
  }, [estado]);

  return (
    <form
      ref={formularioRef}
      action={executarAcao}
      className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4"
    >
      <h3 className="font-medium">Adicionar anexo</h3>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-700">
          Arquivo <span className="text-red-600">*</span>
        </span>
        <input
          type="file"
          name="arquivo"
          required
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
          className={classeCampo}
        />
        <span className="text-xs text-gray-500">Foto, ART, croqui ou laudo — até 15MB.</span>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-700">
          Tipo <span className="text-red-600">*</span>
        </span>
        <select name="tipo" required defaultValue="foto" className={classeCampo}>
          {Object.entries(rotulosTipoAnexo).map(([valor, rotulo]) => (
            <option key={valor} value={valor}>
              {rotulo}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-700">Legenda</span>
        <input name="legenda" placeholder="Ex.: Locação vista da estrada" className={classeCampo} />
      </label>

      <label className="flex min-h-11 items-center gap-2">
        <input type="checkbox" name="incluirNoRelatorio" className="h-5 w-5" />
        <span className="text-sm text-gray-700">Incluir esta foto no relatório final</span>
      </label>

      {estado.erro && (
        <p className="rounded-sm bg-red-50 p-3 text-sm text-red-700">{estado.erro}</p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="min-h-11 rounded-md bg-blue-600 px-4 text-lg font-semibold text-white active:bg-blue-700 disabled:opacity-60"
      >
        {enviando ? "Enviando..." : "Adicionar anexo"}
      </button>
    </form>
  );
}
