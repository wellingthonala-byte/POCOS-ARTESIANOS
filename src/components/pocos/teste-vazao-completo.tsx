"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import {
  atualizarTipoEInicioTeste,
  adicionarLeituraTeste,
  removerUltimaLeituraTeste,
} from "@/app/pocos/acoes";
import { useListaTrechos } from "@/hooks/usar-lista-trechos";
import { envolverAcaoComFilaOffline } from "@/lib/offline/envolver-acao";
import { gerarSvgGraficoLinha } from "@/lib/graficos/grafico-linha";
import { rotulosTipoTesteVazao } from "@/lib/rotulos";
import { TipoTesteVazao } from "@/generated/prisma/enums";
import { Cronometro } from "@/components/pocos/cronometro";

const classeCampo =
  "min-h-11 w-full rounded-sm border border-gray-300 bg-white px-3 text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30";

export type LeituraTeste = {
  id: string;
  tempoMinutos: number;
  nivelDinamico: number;
  vazao: number | null;
};

export function TesteVazaoCompleto({
  pocoId,
  tipoInicial,
  dataHoraInicioInicial,
  nivelEstatico,
  leituras,
}: {
  pocoId: string;
  tipoInicial: string;
  dataHoraInicioInicial: string;
  nivelEstatico: number;
  leituras: LeituraTeste[];
}) {
  const [tipo, setTipo] = useState(tipoInicial);

  const acaoConfigComFila = useMemo(
    () =>
      envolverAcaoComFilaOffline(
        atualizarTipoEInicioTeste.bind(null, pocoId),
        "testeVazao.atualizarTipo",
        pocoId,
        { substituirNaFila: true }
      ),
    [pocoId]
  );
  const [estadoConfig, executarConfig, salvandoConfig] = useActionState(
    acaoConfigComFila,
    {}
  );

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
    adicionarLeituraTeste.bind(null, pocoId),
    removerUltimaLeituraTeste.bind(null, pocoId),
    {},
    {
      pocoId,
      tipoAdicionar: "testeVazao.adicionarLeitura",
      tipoRemover: "testeVazao.removerLeitura",
    }
  );

  const graficoRebaixamento = useMemo(() => {
    const pontos = leituras.map((l) => ({
      x: l.tempoMinutos,
      y: l.nivelDinamico - nivelEstatico,
    }));
    return gerarSvgGraficoLinha(pontos, {
      rotuloEixoX: "Tempo (min)",
      rotuloEixoY: "Rebaixamento (m)",
    });
  }, [leituras, nivelEstatico]);

  const leiturasComVazao = leituras.filter((l) => l.vazao !== null);
  const graficoVazao = useMemo(() => {
    const pontos = leiturasComVazao.map((l) => ({
      x: l.nivelDinamico - nivelEstatico,
      y: l.vazao as number,
    }));
    return gerarSvgGraficoLinha(pontos, {
      rotuloEixoX: "Rebaixamento (m)",
      rotuloEixoY: "Vazão (m³/h)",
      cor: "#d9691d",
    });
  }, [leiturasComVazao, nivelEstatico]);

  return (
    <div className="flex flex-col gap-6">
      <form
        action={executarConfig}
        className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4"
      >
        <h3 className="font-medium">Configuração do teste</h3>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">Tipo de teste</span>
          <select
            name="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className={classeCampo}
          >
            {Object.values(TipoTesteVazao).map((valor) => (
              <option key={valor} value={valor}>
                {rotulosTipoTesteVazao[valor]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">Data/hora de início</span>
          <input
            type="datetime-local"
            name="dataHoraInicio"
            defaultValue={dataHoraInicioInicial}
            className={classeCampo}
          />
        </label>

        {estadoConfig.erro && (
          <p className="rounded-sm bg-red-50 p-3 text-sm text-red-700">
            {estadoConfig.erro}
          </p>
        )}
        {estadoConfig.pendente && (
          <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
            Sem conexão — guardado neste aparelho, será enviado quando a
            internet voltar.
          </p>
        )}

        <button
          type="submit"
          disabled={salvandoConfig}
          className="min-h-11 rounded-md bg-gray-100 px-4 text-sm font-medium text-gray-700 active:bg-gray-200 disabled:opacity-60"
        >
          {salvandoConfig ? "Salvando..." : "Salvar configuração"}
        </button>
      </form>

      <div>
        <h3 className="mb-2 font-medium">Leituras</h3>

        {leituras.length === 0 ? (
          <p className="text-gray-500">Nenhuma leitura lançada ainda.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="p-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Tempo (min)</th>
                  <th className="p-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Nível dinâmico (m)</th>
                  <th className="p-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Rebaixamento (m)</th>
                  <th className="p-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Vazão (m³/h)</th>
                  <th className="p-2" />
                </tr>
              </thead>
              <tbody>
                {leituras.map((leitura, indice) => (
                  <tr key={leitura.id} className="border-b border-gray-100 bg-white last:border-0">
                    <td className="p-2 font-mono">{leitura.tempoMinutos.toFixed(2)}</td>
                    <td className="p-2 font-mono">{leitura.nivelDinamico.toFixed(2)}</td>
                    <td className="p-2 font-mono">
                      {(leitura.nivelDinamico - nivelEstatico).toFixed(2)}
                    </td>
                    <td className="p-2 font-mono">
                      {leitura.vazao !== null ? leitura.vazao.toFixed(3) : "—"}
                    </td>
                    <td className="p-2">
                      {indice === leituras.length - 1 && (
                        <form action={remover}>
                          <button
                            type="submit"
                            disabled={removendo}
                            className="min-h-11 rounded-md px-3 text-sm font-medium text-red-600 active:bg-red-50 disabled:opacity-60"
                          >
                            Remover
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {estadoRemover.erro && (
          <p className="mt-2 rounded-sm bg-red-50 p-3 text-sm text-red-700">
            {estadoRemover.erro}
          </p>
        )}
        {estadoRemover.pendente && (
          <p className="mt-2 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
            Sem conexão — a remoção foi guardada neste aparelho e será
            enviada quando a internet voltar.
          </p>
        )}
      </div>

      <Cronometro
        aoUsarTempo={(minutos) => {
          const campo = formularioRef.current?.elements.namedItem(
            "tempoMinutos"
          ) as HTMLInputElement | null;
          if (campo) campo.value = String(minutos);
        }}
      />

      <form
        ref={formularioRef}
        action={adicionar}
        className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4"
      >
        <h3 className="font-medium">Adicionar leitura</h3>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">
            Tempo decorrido (min) <span className="text-red-600">*</span>
          </span>
          <input
            ref={primeiroCampoRef}
            name="tempoMinutos"
            required
            inputMode="decimal"
            placeholder="Ex.: 15"
            className={classeCampo}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">
            Nível dinâmico (m) <span className="text-red-600">*</span>
          </span>
          <input
            name="nivelDinamico"
            required
            inputMode="decimal"
            placeholder="Ex.: 12.30"
            className={classeCampo}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">
            Vazão do estágio (m³/h)
            {tipo === "escalonado" && <span className="text-red-600"> *</span>}
          </span>
          <input
            name="vazao"
            required={tipo === "escalonado"}
            inputMode="decimal"
            placeholder="Ex.: 3.200"
            className={classeCampo}
          />
        </label>

        {estadoAdicionar.erro && (
          <p className="rounded-sm bg-red-50 p-3 text-sm text-red-700">
            {estadoAdicionar.erro}
          </p>
        )}
        {estadoAdicionar.pendente && (
          <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
            Sem conexão — a leitura foi guardada neste aparelho e será
            enviada quando a internet voltar.
          </p>
        )}

        <button
          type="submit"
          disabled={adicionando}
          className="min-h-11 rounded-md bg-blue-600 px-4 text-lg font-semibold text-white active:bg-blue-700 disabled:opacity-60"
        >
          {adicionando ? "Adicionando..." : "Adicionar leitura"}
        </button>
      </form>

      <div>
        <h3 className="mb-2 font-medium">Rebaixamento × tempo</h3>
        <div
          className="overflow-x-auto rounded-lg border border-gray-200 p-2"
          dangerouslySetInnerHTML={{ __html: graficoRebaixamento }}
        />
      </div>

      {leiturasComVazao.length > 0 && (
        <div>
          <h3 className="mb-2 font-medium">Vazão × rebaixamento</h3>
          <div
            className="overflow-x-auto rounded-lg border border-gray-200 p-2"
            dangerouslySetInnerHTML={{ __html: graficoVazao }}
          />
        </div>
      )}
    </div>
  );
}
