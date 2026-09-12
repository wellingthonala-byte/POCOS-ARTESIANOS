"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

// <tr> não aceita ser um link de verdade em HTML — esse wrapper navega no
// clique da linha inteira (tabela densa de desktop), mas a primeira
// célula continua tendo um <Link> real por dentro (fica a cargo de quem
// usa este componente), pra manter clique-do-meio/abrir-em-nova-aba/
// leitor de tela funcionando sem depender só do onClick.
export function LinhaTabela({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const router = useRouter();
  return (
    <tr
      onClick={() => router.push(href)}
      className="cursor-pointer border-b border-gray-100 bg-white last:border-0 hover:bg-gray-50"
    >
      {children}
    </tr>
  );
}
