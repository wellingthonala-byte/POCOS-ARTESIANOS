"use client";

import { useActionState, useMemo } from "react";
import { excluirPoco, type EstadoFormularioPoco } from "@/app/pocos/acoes";
import { Cartao } from "@/components/ui/cartao";

// Poço não tem uma única tela de "editar" (a identificação é só a etapa 1
// do formulário sequencial, com autosave/conflito/fila offline já
// bastante instrumentados) — por isso a exclusão vive à parte, na página
// de detalhe (o "hub" do poço), em vez de disputar espaço com aquele
// formulário. Sem estado de sucesso a tratar aqui: excluirPoco (pocos/
// acoes.ts) redireciona pro servidor com redirect(), não devolve
// {sucesso: true} — client-side router.push depois de ver "sucesso" não
// funcionaria de verdade aqui, porque a própria action já provoca um
// refresh de /pocos/[id] que cairia em notFound() (excluidoEm deixou de
// ser null) antes desse componente reagir ao estado.
export function FormularioExcluirPoco({ pocoId }: { pocoId: string }) {
  const acao = useMemo(() => excluirPoco.bind(null, pocoId), [pocoId]);
  const [estado, executarAcao, excluindo] = useActionState<
    EstadoFormularioPoco,
    FormData
  >(acao, {});

  return (
    <Cartao titulo="Zona de risco" corBorda="border-red-300">
      <p className="text-sm text-gray-500">
        Oculta este poço e todos os dados lançados nele (perfuração,
        litologia, construtivo, testes, análises e anexos). O dado não é
        apagado do banco, só deixa de aparecer no sistema.
      </p>

      {estado.erro && (
        <p className="mt-3 rounded-sm bg-red-50 p-3 text-sm text-red-700">{estado.erro}</p>
      )}

      <form
        action={executarAcao}
        onSubmit={(evento) => {
          if (!confirm("Excluir este poço e ocultar todos os dados lançados nele?")) {
            evento.preventDefault();
          }
        }}
      >
        <button
          type="submit"
          disabled={excluindo}
          className="mt-3 min-h-11 w-full rounded-sm border border-red-300 px-4 text-sm font-medium text-red-600 active:bg-red-50 disabled:opacity-60"
        >
          {excluindo ? "Excluindo..." : "Excluir poço"}
        </button>
      </form>
    </Cartao>
  );
}
