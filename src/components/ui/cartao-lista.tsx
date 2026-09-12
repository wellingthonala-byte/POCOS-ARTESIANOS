import Link from "next/link";
import type { ReactNode } from "react";

// Casca do card clicável repetida nas listas (poços/obras/clientes) —
// borda esquerda espessa faz o papel de "lombada de pasta técnica",
// reforçando a leitura de ficha/registro sem precisar de mais elementos.
export function CartaoLista({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block rounded-sm border border-gray-200 border-l-4 border-l-blue-600 bg-white p-4 shadow-sm shadow-gray-900/5 active:bg-gray-50"
    >
      {children}
    </Link>
  );
}
