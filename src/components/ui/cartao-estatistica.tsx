import Link from "next/link";

// Ladrilho de número grande usado só na tela inicial (dashboard) — número
// em mono (mesma convenção de dado técnico) pra ficar claramente "leitura
// de painel", não um rótulo de texto comum.
export function CartaoEstatistica({
  rotulo,
  valor,
  href,
  destaque,
}: {
  rotulo: string;
  valor: number;
  href?: string;
  destaque?: boolean;
}) {
  const conteudo = (
    <div
      className={`rounded-sm border p-4 ${
        destaque
          ? "border-orange-300 bg-orange-50"
          : "border-gray-200 bg-white"
      }`}
    >
      <p className="font-mono text-3xl font-bold text-gray-900">{valor}</p>
      <p className="mt-1 text-sm text-gray-600">{rotulo}</p>
    </div>
  );

  if (!href) return conteudo;

  return (
    <Link href={href} className="block active:opacity-80">
      {conteudo}
    </Link>
  );
}
