"use client";

import { useActionState, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { StatusPoco, MetodoObtencaoCoordenada } from "@/generated/prisma/enums";
import { useRascunhoFormulario } from "@/hooks/usar-rascunho-formulario";
import type { EstadoFormularioPoco } from "@/app/pocos/acoes";
import { envolverAcaoComFilaOffline } from "@/lib/offline/envolver-acao";
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
  valoresIniciais?: Partial<ValoresFormulario> & { id?: string; atualizadoEm?: string };
  acao: (
    estado: EstadoFormularioPoco,
    formData: FormData
  ) => Promise<EstadoFormularioPoco>;
}) {
  const router = useRouter();
  const pocoId = valoresIniciais?.id;

  // Suporte offline (Fase 5, etapa 3) só entra na edição de um poço já
  // existente: criar um poço novo sem conexão precisaria de um mecanismo
  // diferente (gerar um ID temporário no cliente e reconciliar depois com
  // o ID real do banco), que ainda não existe — ver CLAUDE.md.
  const acaoComFila = useMemo(
    () =>
      pocoId
        ? envolverAcaoComFilaOffline(acao, "identificacao.atualizar", pocoId, {
            substituirNaFila: true,
          })
        : acao,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pocoId]
  );
  const [estado, executarAcao, emAndamento] = useActionState(acaoComFila, {});

  // Marca de detecção de conflito (Fase 5, etapa 4) — ver
  // aplicarComVerificacaoDeConflito em acoes.ts. Só avança quando a
  // gravação realmente aplicou: se deu conflito, fica no valor antigo de
  // propósito, pra uma nova tentativa continuar acusando o conflito em vez
  // de sobrescrever por trás do usuário.
  const [atualizadoEmConhecido, setAtualizadoEmConhecido] = useState(
    valoresIniciais?.atualizadoEm ?? null
  );

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
    if (estado.conflito) {
      // Alguém alterou este poço enquanto o técnico estava offline — a
      // gravação NÃO foi aplicada, então não limpa rascunho nem navega:
      // o usuário precisa ver o aviso antes de decidir o que fazer.
      setVersaoFormulario((v) => v + 1);
      return;
    }
    if (estado.atualizadoEm) {
      setAtualizadoEmConhecido(estado.atualizadoEm);
    }
    if (estado.sucesso) {
      limparRascunho();
      // No caminho offline (etapa 3), a action nem chega a rodar no
      // servidor — a alteração fica só na fila local — então o estado
      // devolvido não tem `pocoId` (é o próprio poço sendo editado, cujo
      // ID já se conhece de antemão).
      const idDestino = estado.pocoId ?? pocoId;
      router.push(idDestino ? `/pocos/${idDestino}/perfuracao` : "/pocos");
      return;
    }
    if (estado.erro) {
      setVersaoFormulario((v) => v + 1);
    }
  }, [estado, limparRascunho, router, pocoId]);

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
      {atualizadoEmConhecido && (
        <input type="hidden" name="baseAtualizadoEm" value={atualizadoEmConhecido} />
      )}

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

      {estado.conflito && (
        <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          Alguém alterou este poço enquanto você estava offline — esta
          alteração NÃO foi salva, para não sobrescrever o que já foi
          lançado. O escritório vai revisar as duas versões.
        </p>
      )}

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
