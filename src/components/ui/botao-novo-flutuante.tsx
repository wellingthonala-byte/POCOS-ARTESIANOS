import Link from "next/link";

// Botão flutuante de "criar novo", repetido em Poços/Obras/Clientes —
// laranja de propósito: é o único acento forte da tela, reservado pra
// ação mais importante (o resto usa o azul de prancheta como cor de base).
export function BotaoNovoFlutuante({
  href,
  rotulo,
}: {
  href: string;
  rotulo: string;
}) {
  return (
    <Link
      href={href}
      className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-3xl text-white shadow-lg shadow-orange-900/20 active:bg-orange-600"
      aria-label={rotulo}
    >
      +
    </Link>
  );
}
