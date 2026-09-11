"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { StatusPoco, MetodoObtencaoCoordenada } from "@/generated/prisma/enums";
import { useRascunhoFormulario } from "@/hooks/usar-rascunho-formulario";
import type { EstadoFormularioPoco } from "@/app/pocos/acoes";
import {
  rotulosStatusPoco,
  rotulosMetodoObtencaoCoordenada,
} from "@/lib/rotulos";

type Obra = { id: string; rotulo: string };

type ValoresFormulario = {
  identificacao: string;
  obraId: string;
  status: string;
  municipio: string;
  uf: string;
  latitude: string;
  longitude: string;
  metodoObtencaoCoordenada: string;
};

const valoresPadrao: ValoresFormulario = {
  identificacao: "",
  obraId: "",
  status: StatusPoco.planejado,
  municipio: "",
  uf: "",
  latitude: "",
  longitude: "",
  metodoObtencaoCoordenada: MetodoObtencaoCoordenada.manual,
};

const classeCampo =
  "min-h-11 w-full rounded-md border border-gray-300 px-3 text-base";

export function FormularioIdentificacaoLocacao({
  obras,
  valoresIniciais,
  acao,
}: {
  obras: Obra[];
  valoresIniciais?: Partial<ValoresFormulario> & { id?: string };
  acao: (
    estado: EstadoFormularioPoco,
    formData: FormData
  ) => Promise<EstadoFormularioPoco>;
}) {
  const router = useRouter();
  const [estado, executarAcao, emAndamento] = useActionState(acao, {});

  const chaveRascunho = valoresIniciais?.id ? null : "rascunho-poco-novo";
  const { valores, setValores, limparRascunho } = useRascunhoFormulario(
    chaveRascunho,
    { ...valoresPadrao, ...valoresIniciais }
  );

  const [obtendoGps, setObtendoGps] = useState(false);
  const [erroGps, setErroGps] = useState<string | null>(null);

  // Após qualquer retorno de ação (sucesso ou erro), remonta os campos do
  // formulário com uma nova key: alguns navegadores fazem um reset nativo do
  // <select> quando uma ação de formulário é concluída, e como o valor
  // controlado não muda, o React não reescreve o DOM — a remontagem força a
  // sincronização novamente a partir do estado (que continua correto).
  const [versaoFormulario, setVersaoFormulario] = useState(0);

  useEffect(() => {
    if (estado.sucesso) {
      limparRascunho();
      router.push(estado.pocoId ? `/pocos/${estado.pocoId}/perfuracao` : "/pocos");
      return;
    }
    if (estado.erro) {
      setVersaoFormulario((v) => v + 1);
    }
  }, [estado, limparRascunho, router]);

  function atualizarCampo<C extends keyof ValoresFormulario>(
    campo: C,
    valor: ValoresFormulario[C]
  ) {
    setValores((atual) => ({ ...atual, [campo]: valor }));
  }

  function usarGpsDoCelular() {
    if (!("geolocation" in navigator)) {
      setErroGps("Este aparelho não suporta GPS pelo navegador.");
      return;
    }
    setErroGps(null);
    setObtendoGps(true);
    navigator.geolocation.getCurrentPosition(
      (posicao) => {
        atualizarCampo("latitude", posicao.coords.latitude.toFixed(7));
        atualizarCampo("longitude", posicao.coords.longitude.toFixed(7));
        atualizarCampo(
          "metodoObtencaoCoordenada",
          MetodoObtencaoCoordenada.gps_celular
        );
        setObtendoGps(false);
      },
      () => {
        setErroGps(
          "Não foi possível obter a localização. Verifique a permissão de GPS."
        );
        setObtendoGps(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  return (
    <form
      key={versaoFormulario}
      action={executarAcao}
      className="flex flex-col gap-5"
    >
      <Campo rotulo="Identificação do poço" obrigatorio>
        <input
          name="identificacao"
          value={valores.identificacao}
          onChange={(e) => atualizarCampo("identificacao", e.target.value)}
          required
          placeholder="Ex.: PT-01"
          className={classeCampo}
        />
      </Campo>

      <Campo rotulo="Obra" obrigatorio>
        <select
          name="obraId"
          value={valores.obraId}
          onChange={(e) => atualizarCampo("obraId", e.target.value)}
          required
          className={classeCampo}
        >
          <option value="" disabled>
            Selecione a obra
          </option>
          {obras.map((obra) => (
            <option key={obra.id} value={obra.id}>
              {obra.rotulo}
            </option>
          ))}
        </select>
      </Campo>

      <Campo rotulo="Status">
        <select
          name="status"
          value={valores.status}
          onChange={(e) => atualizarCampo("status", e.target.value)}
          className={classeCampo}
        >
          {Object.values(StatusPoco).map((valor) => (
            <option key={valor} value={valor}>
              {rotulosStatusPoco[valor]}
            </option>
          ))}
        </select>
      </Campo>

      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Município">
          <input
            name="municipio"
            value={valores.municipio}
            onChange={(e) => atualizarCampo("municipio", e.target.value)}
            className={classeCampo}
          />
        </Campo>
        <Campo rotulo="UF">
          <input
            name="uf"
            value={valores.uf}
            onChange={(e) =>
              atualizarCampo("uf", e.target.value.toUpperCase())
            }
            maxLength={2}
            className={classeCampo}
          />
        </Campo>
      </div>

      <div className="rounded-lg border border-gray-200 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <span className="font-medium">Coordenadas (SIRGAS 2000)</span>
          <button
            type="button"
            onClick={usarGpsDoCelular}
            disabled={obtendoGps}
            className="min-h-11 rounded-md bg-blue-600 px-4 text-sm font-medium text-white active:bg-blue-700 disabled:opacity-60"
          >
            {obtendoGps ? "Obtendo..." : "Usar GPS do celular"}
          </button>
        </div>

        {erroGps && <p className="mb-3 text-sm text-red-600">{erroGps}</p>}

        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Latitude" obrigatorio>
            <input
              name="latitude"
              value={valores.latitude}
              onChange={(e) => atualizarCampo("latitude", e.target.value)}
              required
              inputMode="decimal"
              placeholder="-18.9186000"
              className={classeCampo}
            />
          </Campo>
          <Campo rotulo="Longitude" obrigatorio>
            <input
              name="longitude"
              value={valores.longitude}
              onChange={(e) => atualizarCampo("longitude", e.target.value)}
              required
              inputMode="decimal"
              placeholder="-48.2772000"
              className={classeCampo}
            />
          </Campo>
        </div>

        <Campo rotulo="Método de obtenção da coordenada">
          <select
            name="metodoObtencaoCoordenada"
            value={valores.metodoObtencaoCoordenada}
            onChange={(e) =>
              atualizarCampo("metodoObtencaoCoordenada", e.target.value)
            }
            className={classeCampo}
          >
            {Object.values(MetodoObtencaoCoordenada).map((valor) => (
              <option key={valor} value={valor}>
                {rotulosMetodoObtencaoCoordenada[valor]}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      {estado.erro && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {estado.erro}
        </p>
      )}

      <button
        type="submit"
        disabled={emAndamento}
        className="min-h-11 rounded-md bg-blue-600 px-4 text-lg font-semibold text-white active:bg-blue-700 disabled:opacity-60"
      >
        {emAndamento ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}

function Campo({
  rotulo,
  obrigatorio,
  children,
}: {
  rotulo: string;
  obrigatorio?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-gray-700">
        {rotulo}
        {obrigatorio && <span className="text-red-600"> *</span>}
      </span>
      {children}
    </label>
  );
}
