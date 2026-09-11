"use client";

import { useEffect, useRef, useState } from "react";

function formatarDuracao(segundosTotais: number): string {
  const minutos = Math.floor(segundosTotais / 60);
  const segundos = Math.floor(segundosTotais % 60);
  return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
}

/**
 * Cronômetro simples para cronometrar o teste de vazão em campo — evita o
 * técnico ter que olhar outro relógio e fazer conta de cabeça pra saber o
 * tempo decorrido de cada leitura. "Usar este tempo" preenche o campo de
 * tempo decorrido (em minutos) do formulário de leitura, mas o valor
 * continua editável manualmente depois.
 */
export function Cronometro({
  aoUsarTempo,
}: {
  aoUsarTempo: (minutos: number) => void;
}) {
  const [rodando, setRodando] = useState(false);
  const [segundosDecorridos, setSegundosDecorridos] = useState(0);
  const inicioRef = useRef<number | null>(null);

  useEffect(() => {
    if (!rodando) return;
    const intervalo = setInterval(() => {
      if (inicioRef.current !== null) {
        setSegundosDecorridos((Date.now() - inicioRef.current) / 1000);
      }
    }, 250);
    return () => clearInterval(intervalo);
  }, [rodando]);

  function iniciar() {
    inicioRef.current = Date.now() - segundosDecorridos * 1000;
    setRodando(true);
  }

  function pausar() {
    setRodando(false);
  }

  function zerar() {
    setRodando(false);
    setSegundosDecorridos(0);
    inicioRef.current = null;
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 p-3">
      <span className="min-w-[4.5rem] font-mono text-2xl font-semibold tabular-nums">
        {formatarDuracao(segundosDecorridos)}
      </span>
      <div className="flex flex-wrap gap-2">
        {!rodando ? (
          <button
            type="button"
            onClick={iniciar}
            className="min-h-11 rounded-md bg-blue-600 px-4 text-sm font-medium text-white active:bg-blue-700"
          >
            {segundosDecorridos > 0 ? "Continuar" : "Iniciar"}
          </button>
        ) : (
          <button
            type="button"
            onClick={pausar}
            className="min-h-11 rounded-md bg-gray-100 px-4 text-sm font-medium text-gray-700 active:bg-gray-200"
          >
            Pausar
          </button>
        )}
        <button
          type="button"
          onClick={zerar}
          className="min-h-11 rounded-md bg-gray-100 px-4 text-sm font-medium text-gray-700 active:bg-gray-200"
        >
          Zerar
        </button>
        <button
          type="button"
          onClick={() => aoUsarTempo(Math.round((segundosDecorridos / 60) * 100) / 100)}
          className="min-h-11 rounded-md bg-green-600 px-4 text-sm font-medium text-white active:bg-green-700"
        >
          Usar este tempo
        </button>
      </div>
    </div>
  );
}
