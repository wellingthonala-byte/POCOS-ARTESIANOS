import Link from "next/link";

// De propósito SEM busca de dado: este componente entra no layout raiz,
// compartilhado até pela página estática /offline (Fase 5) — uma consulta
// ao banco aqui obrigaria até a build de produção a depender do Postgres
// estar de pé, só para uma contagem decorativa no link de Conflitos.
export function NavegacaoPrincipal() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <nav className="mx-auto flex max-w-2xl flex-wrap gap-1 p-2">
        <Link
          href="/pocos"
          className="flex min-h-11 items-center rounded-md px-3 font-medium text-gray-700 active:bg-gray-100"
        >
          Poços
        </Link>
        <Link
          href="/obras"
          className="flex min-h-11 items-center rounded-md px-3 font-medium text-gray-700 active:bg-gray-100"
        >
          Obras
        </Link>
        <Link
          href="/clientes"
          className="flex min-h-11 items-center rounded-md px-3 font-medium text-gray-700 active:bg-gray-100"
        >
          Clientes
        </Link>
        <Link
          href="/configuracoes"
          className="flex min-h-11 items-center rounded-md px-3 font-medium text-gray-700 active:bg-gray-100"
        >
          Configurações
        </Link>
        <Link
          href="/conflitos"
          className="flex min-h-11 items-center rounded-md px-3 font-medium text-gray-700 active:bg-gray-100"
        >
          Conflitos
        </Link>
      </nav>
    </header>
  );
}
