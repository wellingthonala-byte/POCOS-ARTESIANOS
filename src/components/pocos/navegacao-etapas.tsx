import Link from "next/link";

type Etapa = {
  chave: string;
  numero: number;
  rotulo: string;
  disponivel: boolean;
};

const etapas: Etapa[] = [
  { chave: "identificacao", numero: 1, rotulo: "Identificação", disponivel: true },
  { chave: "perfuracao", numero: 2, rotulo: "Perfuração", disponivel: true },
  { chave: "litologia", numero: 3, rotulo: "Litologia", disponivel: true },
  { chave: "construtivo", numero: 4, rotulo: "Construtivo", disponivel: true },
  { chave: "niveis-vazao", numero: 5, rotulo: "Níveis e vazão", disponivel: true },
];

export function NavegacaoEtapas({
  pocoId,
  etapaAtual,
}: {
  pocoId: string;
  etapaAtual: string;
}) {
  return (
    <nav className="mb-6 flex flex-wrap gap-2 text-sm">
      {etapas.map((etapa) => {
        const rotuloCompleto = `${etapa.numero}. ${etapa.rotulo}`;

        if (!etapa.disponivel) {
          return (
            <span
              key={etapa.chave}
              className="rounded-full bg-gray-50 px-3 py-1.5 font-medium text-gray-400"
            >
              {rotuloCompleto}
            </span>
          );
        }

        const ativa = etapa.chave === etapaAtual;
        return (
          <Link
            key={etapa.chave}
            href={`/pocos/${pocoId}/${etapa.chave}`}
            className={`rounded-full px-3 py-1.5 font-medium ${
              ativa ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            {rotuloCompleto}
          </Link>
        );
      })}
    </nav>
  );
}
