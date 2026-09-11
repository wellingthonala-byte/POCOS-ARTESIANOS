"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  adicionarCamadaLitologica,
  removerUltimaCamadaLitologica,
} from "@/app/pocos/acoes";

const sugestoesLitologia = [
  "Areia fina",
  "Areia média",
  "Areia grossa",
  "Areia argilosa",
  "Argila",
  "Argila siltosa",
  "Argila arenosa",
  "Silte",
  "Cascalho",
  "Granito",
  "Granito alterado",
  "Gnaisse",
  "Gnaisse alterado",
  "Basalto",
  "Arenito",
  "Calcário",
  "Laterita",
  "Saprolito",
];

type Camada = {
  id: string;
  profundidadeInicial: string;
  profundidadeFinal: string;
  descricao: string;
};

export function FormularioLitologia({
  pocoId,
  camadas,
  proximaEtapaUrl,
}: {
  pocoId: string;
  camadas: Camada[];
  proximaEtapaUrl: string;
}) {
  const router = useRouter();
  const ultimaCamada = camadas[camadas.length - 1];
  const profundidadeInicialProxima = ultimaCamada
    ? ultimaCamada.profundidadeFinal
    : "0.00";

  const [estadoAdicionar, adicionar, adicionando] = useActionState(
    adicionarCamadaLitologica.bind(null, pocoId),
    {}
  );
  const [estadoRemover, remover, removendo] = useActionState(
    removerUltimaCamadaLitologica.bind(null, pocoId),
    {}
  );

  const formularioRef = useRef<HTMLFormElement>(null);
  const campoProfundidadeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (estadoAdicionar.sucesso) {
      formularioRef.current?.reset();
      campoProfundidadeRef.current?.focus();
    }
  }, [estadoAdicionar]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="mb-2 text-lg font-semibold">Perfil litológico</h2>

        {camadas.length === 0 ? (
          <p className="text-gray-500">Nenhuma camada lançada ainda.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {camadas.map((camada, indice) => (
              <li
                key={camada.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-3"
              >
                <span>
                  <strong>
                    {camada.profundidadeInicial}–{camada.profundidadeFinal} m
                  </strong>{" "}
                  {camada.descricao}
                </span>
                {indice === camadas.length - 1 && (
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
      </div>

      <form
        ref={formularioRef}
        action={adicionar}
        className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4"
      >
        <h3 className="font-medium">Adicionar camada</h3>
        <p className="text-sm text-gray-500">
          Profundidade inicial (calculada): {profundidadeInicialProxima} m
        </p>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">
            Profundidade final (m) <span className="text-red-600">*</span>
          </span>
          <input
            ref={campoProfundidadeRef}
            name="profundidadeFinal"
            required
            inputMode="decimal"
            placeholder="Ex.: 15.00"
            className="min-h-11 w-full rounded-md border border-gray-300 px-3 text-base"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">
            Descrição <span className="text-red-600">*</span>
          </span>
          <input
            name="descricao"
            required
            list="sugestoes-litologia"
            placeholder="Ex.: Areia argilosa"
            className="min-h-11 w-full rounded-md border border-gray-300 px-3 text-base"
          />
          <datalist id="sugestoes-litologia">
            {sugestoesLitologia.map((sugestao) => (
              <option key={sugestao} value={sugestao} />
            ))}
          </datalist>
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
          {adicionando ? "Adicionando..." : "Adicionar camada"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => router.push(proximaEtapaUrl)}
        className="min-h-11 rounded-md bg-gray-100 px-4 text-lg font-semibold text-gray-700 active:bg-gray-200"
      >
        Concluir litologia
      </button>
    </div>
  );
}
