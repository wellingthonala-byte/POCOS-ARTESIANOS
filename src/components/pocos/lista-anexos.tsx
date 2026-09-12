"use client";

import { useActionState, useMemo } from "react";
import { removerAnexo, type EstadoAnexo } from "@/app/pocos/acoes";
import { envolverAcaoSemFila } from "@/lib/offline/envolver-acao";
import { rotulosTipoAnexo } from "@/lib/rotulos";

export type AnexoLista = {
  id: string;
  tipo: string;
  arquivoUrl: string;
  nomeArquivo: string;
  legenda: string | null;
  incluirNoRelatorio: boolean;
};

function ehImagem(nomeArquivo: string): boolean {
  return /\.(jpe?g|png|webp|heic|heif)$/i.test(nomeArquivo);
}

function CartaoAnexo({ pocoId, anexo }: { pocoId: string; anexo: AnexoLista }) {
  const acaoRemover = useMemo(
    () => envolverAcaoSemFila<EstadoAnexo>(removerAnexo.bind(null, anexo.id, pocoId)),
    [anexo.id, pocoId]
  );
  const [estado, executar, removendo] = useActionState(acaoRemover, {});

  return (
    <li className="flex gap-3 rounded-sm border border-gray-200 bg-white p-3">
      <a
        href={anexo.arquivoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0"
      >
        {ehImagem(anexo.nomeArquivo) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={anexo.arquivoUrl}
            alt={anexo.legenda ?? anexo.nomeArquivo}
            className="h-20 w-20 rounded-md border border-gray-200 object-cover"
          />
        ) : (
          <span className="flex h-20 w-20 items-center justify-center rounded-sm border border-gray-200 bg-gray-100 font-mono text-sm font-semibold text-gray-500">
            PDF
          </span>
        )}
      </a>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-sm bg-gray-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-gray-700">
            {rotulosTipoAnexo[anexo.tipo] ?? anexo.tipo}
          </span>
          {anexo.incluirNoRelatorio && (
            <span className="rounded-sm bg-orange-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-orange-700">
              No relatório
            </span>
          )}
        </div>
        <p className="truncate text-sm text-gray-700">{anexo.legenda || anexo.nomeArquivo}</p>

        {estado.erro && <p className="text-sm text-red-700">{estado.erro}</p>}

        <form action={executar}>
          <button
            type="submit"
            disabled={removendo}
            className="mt-1 min-h-11 rounded-md px-2 text-sm font-medium text-red-600 active:bg-red-50 disabled:opacity-60"
          >
            {removendo ? "Removendo..." : "Remover"}
          </button>
        </form>
      </div>
    </li>
  );
}

export function ListaAnexos({
  pocoId,
  anexos,
}: {
  pocoId: string;
  anexos: AnexoLista[];
}) {
  if (anexos.length === 0) {
    return <p className="text-gray-500">Nenhum anexo enviado ainda.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {anexos.map((anexo) => (
        <CartaoAnexo key={anexo.id} pocoId={pocoId} anexo={anexo} />
      ))}
    </ul>
  );
}
