"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Vira componente cliente só pelo usePathname (destacar o link ativo) —
// continua sem buscar dado nenhum (ver decisão original: esse componente
// é herdado até pela página estática /offline, então uma consulta ao
// banco aqui obrigaria a build de produção a depender do Postgres estar
// de pé só por causa de um detalhe visual).
const links = [
  { href: "/pocos", rotulo: "Poços" },
  { href: "/obras", rotulo: "Obras" },
  { href: "/clientes", rotulo: "Clientes" },
  { href: "/configuracoes", rotulo: "Config." },
  { href: "/conflitos", rotulo: "Conflitos" },
];

export function NavegacaoPrincipal() {
  const pathname = usePathname();

  return (
    <header className="bg-blue-900">
      <div className="mx-auto max-w-2xl px-3 pt-2.5">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-orange-400">
          Registro de Poços
        </span>
      </div>
      <nav className="mx-auto flex max-w-2xl flex-wrap gap-1 px-2 pb-2 pt-1.5">
        {links.map((link) => {
          const ativo =
            pathname === link.href || pathname?.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex min-h-11 items-center rounded-sm px-3 text-sm font-medium transition-colors ${
                ativo
                  ? "bg-orange-500 text-white"
                  : "text-blue-100 active:bg-blue-800"
              }`}
            >
              {link.rotulo}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
