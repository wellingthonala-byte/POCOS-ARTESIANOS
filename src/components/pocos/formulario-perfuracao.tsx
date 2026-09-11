"use client";

import { useRouter } from "next/navigation";
import { MetodoPerfuracao } from "@/generated/prisma/enums";
import { atualizarPerfuracao } from "@/app/pocos/acoes";
import { useAutosavePoco } from "@/hooks/usar-autosave-poco";
import { rotulosMetodoPerfuracao } from "@/lib/rotulos";

type ValoresPerfuracao = {
  metodoPerfuracao: string;
  dataInicioPerfuracao: string;
  dataFimPerfuracao: string;
  profundidadeFinal: string;
  numeroArt: string;
  responsavelTecnicoId: string;
};

const classeCampo =
  "min-h-11 w-full rounded-md border border-gray-300 px-3 text-base";

type ResponsavelTecnico = { id: string; nome: string; crea: string | null };

export function FormularioPerfuracao({
  pocoId,
  atualizadoEmInicial,
  valoresIniciais,
  responsaveisTecnicos,
  proximaEtapaUrl,
}: {
  pocoId: string;
  atualizadoEmInicial: string;
  valoresIniciais: ValoresPerfuracao;
  responsaveisTecnicos: ResponsavelTecnico[];
  proximaEtapaUrl: string;
}) {
  const router = useRouter();
  const { valores, atualizarCampo, salvar, emAndamento, status, mensagemErro } =
    useAutosavePoco(
      valoresIniciais,
      atualizadoEmInicial,
      atualizarPerfuracao.bind(null, pocoId),
      { pocoId, tipo: "perfuracao.atualizar" }
    );

  function salvarEContinuar() {
    salvar(valores, () => router.push(proximaEtapaUrl));
  }

  return (
    <div className="flex flex-col gap-5">
      <Campo rotulo="Método de perfuração">
        <select
          value={valores.metodoPerfuracao}
          onChange={(e) => atualizarCampo("metodoPerfuracao", e.target.value)}
          className={classeCampo}
        >
          <option value="">Não informado</option>
          {Object.values(MetodoPerfuracao).map((valor) => (
            <option key={valor} value={valor}>
              {rotulosMetodoPerfuracao[valor]}
            </option>
          ))}
        </select>
      </Campo>

      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Início da perfuração">
          <input
            type="date"
            value={valores.dataInicioPerfuracao}
            onChange={(e) =>
              atualizarCampo("dataInicioPerfuracao", e.target.value)
            }
            className={classeCampo}
          />
        </Campo>
        <Campo rotulo="Fim da perfuração">
          <input
            type="date"
            value={valores.dataFimPerfuracao}
            onChange={(e) =>
              atualizarCampo("dataFimPerfuracao", e.target.value)
            }
            className={classeCampo}
          />
        </Campo>
      </div>

      <Campo rotulo="Profundidade final (m)">
        <input
          value={valores.profundidadeFinal}
          onChange={(e) => atualizarCampo("profundidadeFinal", e.target.value)}
          inputMode="decimal"
          placeholder="Ex.: 60.00"
          className={classeCampo}
        />
      </Campo>

      <Campo rotulo="Número da ART">
        <input
          value={valores.numeroArt}
          onChange={(e) => atualizarCampo("numeroArt", e.target.value)}
          placeholder="Ex.: MG20240012345"
          className={classeCampo}
        />
      </Campo>

      <Campo rotulo="Responsável técnico">
        <select
          value={valores.responsavelTecnicoId}
          onChange={(e) =>
            atualizarCampo("responsavelTecnicoId", e.target.value)
          }
          className={classeCampo}
        >
          <option value="">Não informado</option>
          {responsaveisTecnicos.map((usuario) => (
            <option key={usuario.id} value={usuario.id}>
              {usuario.nome}
              {usuario.crea ? ` — CREA ${usuario.crea}` : ""}
            </option>
          ))}
        </select>
      </Campo>

      <p aria-live="polite" className="min-h-5 text-sm text-gray-500">
        {emAndamento
          ? "Salvando..."
          : status === "salvo"
            ? "Alterações salvas."
            : status === "pendente"
              ? "Sem conexão — guardado neste aparelho, será enviado quando a internet voltar."
              : ""}
      </p>

      {status === "conflito" && (
        <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          Alguém alterou este poço enquanto você estava offline — esta
          alteração NÃO foi salva, para não sobrescrever o que já foi
          lançado. O escritório vai revisar as duas versões.
        </p>
      )}

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
        {emAndamento ? "Salvando..." : "Salvar e continuar"}
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
