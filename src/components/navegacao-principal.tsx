"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Vira componente cliente só pelo usePathname (destacar o link ativo) —
// continua sem buscar dado nenhum (ver decisão original: esse componente
// é herdado até pela página estática /offline, então uma consulta ao
// banco aqui obrigaria a build de produção a depender do Postgres estar
// de pé só por causa de um detalhe visual).
//
// Um só componente cobre os dois formatos (barra no topo no celular,
// menu lateral fixo no desktop) via classe responsiva — nunca os dois ao
// mesmo tempo — porque o público de campo usa celular e o escritório usa
// desktop (ver CLAUDE.md), e cada um pede um layout de navegação
// diferente, não só uma versão "espremida" do outro.
const links = [
  { href: "/", rotulo: "Início", exato: true },
  { href: "/pocos", rotulo: "Poços" },
  { href: "/obras", rotulo: "Obras" },
  { href: "/clientes", rotulo: "Clientes" },
  { href: "/configuracoes", rotulo: "Configurações" },
  { href: "/conflitos", rotulo: "Conflitos" },
];

export function NavegacaoPrincipal() {
  const pathname = usePathname();

  function estaAtivo(href: string, exato?: boolean) {
    if (exato) return pathname === href;
    return pathname === href || pathname?.startsWith(`${href}/`);
  }

  return (
    <>
      {/* Celular: barra no topo, rótulos abreviados, tudo cabe numa linha */}
      <header className="bg-blue-900 md:hidden">
        <div className="mx-auto max-w-2xl px-3 pt-2.5">
          <Link
            href="/"
            className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-orange-400"
          >
            Registro de Poços
          </Link>
        </div>
        <nav className="mx-auto flex max-w-2xl flex-wrap gap-1 px-2 pb-2 pt-1.5">
          {links
            .filter((link) => link.href !== "/")
            .map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex min-h-11 items-center rounded-sm px-3 text-sm font-medium transition-colors ${
                  estaAtivo(link.href)
                    ? "bg-orange-500 text-white"
                    : "text-blue-100 active:bg-blue-800"
                }`}
              >
                {link.rotulo === "Configurações" ? "Config." : link.rotulo}
              </Link>
            ))}
        </nav>
      </header>

      {/* Desktop (escritório): menu lateral fixo, rótulo completo */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-blue-900 md:flex">
        <div className="px-5 pb-6 pt-6">
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-orange-400">
            Registro de
          </span>
          <br />
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-orange-400">
            Poços
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex min-h-11 items-center rounded-sm px-3 text-[15px] font-medium transition-colors ${
                estaAtivo(link.href, link.exato)
                  ? "bg-orange-500 text-white"
                  : "text-blue-100 hover:bg-blue-800"
              }`}
            >
              {link.rotulo}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
