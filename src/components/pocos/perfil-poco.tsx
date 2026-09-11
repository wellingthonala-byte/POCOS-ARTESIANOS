"use client";

import { useMemo, useState } from "react";
import { gerarSvgPerfilPoco } from "@/lib/perfil/perfil";
import { calcularEscalaAutomatica } from "@/lib/perfil/escala";
import type { CamadaPerfil } from "@/lib/perfil/litologico";
import type { DadosConstrutivo } from "@/lib/perfil/construtivo";

const PIXELS_POR_METRO_MINIMO = 1;
const PIXELS_POR_METRO_MAXIMO = 60;

export function PerfilPoco({
  camadas,
  construtivo,
  profundidadeTotal,
}: {
  camadas: CamadaPerfil[];
  construtivo: DadosConstrutivo;
  profundidadeTotal: number;
}) {
  const escalaAutomatica = useMemo(
    () => calcularEscalaAutomatica(profundidadeTotal),
    [profundidadeTotal]
  );
  const [pixelsPorMetro, setPixelsPorMetro] = useState(escalaAutomatica);

  const svg = useMemo(
    () =>
      gerarSvgPerfilPoco({
        camadas,
        construtivo,
        profundidadeTotal,
        pixelsPorMetro,
      }),
    [camadas, construtivo, profundidadeTotal, pixelsPorMetro]
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          Escala (px/m)
          <input
            type="number"
            min={PIXELS_POR_METRO_MINIMO}
            max={PIXELS_POR_METRO_MAXIMO}
            step={0.5}
            value={pixelsPorMetro}
            onChange={(e) => {
              const valor = Number(e.target.value);
              if (!Number.isNaN(valor) && valor > 0) setPixelsPorMetro(valor);
            }}
            className="min-h-11 w-24 rounded-md border border-gray-300 px-2 text-base"
          />
        </label>
        <button
          type="button"
          onClick={() => setPixelsPorMetro(escalaAutomatica)}
          className="min-h-11 rounded-md bg-gray-100 px-3 text-sm font-medium text-gray-700 active:bg-gray-200"
        >
          Escala automática
        </button>
      </div>

      <div
        className="overflow-x-auto rounded-lg border border-gray-200 p-3"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}
