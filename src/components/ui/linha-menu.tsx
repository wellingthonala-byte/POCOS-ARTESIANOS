import Link from "next/link";

// Linha de menu (rótulo + seta), usada pra agrupar atalhos dentro de um
// Cartao em vez de repetir um botão inteiro por seção — mais compacto,
// lê como um menu de configurações do que como uma pilha de blocos iguais.
export function LinhaMenu({
  href,
  rotulo,
  descricao,
}: {
  href: string;
  rotulo: string;
  descricao?: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-11 items-center justify-between gap-2 border-t border-gray-100 py-3 first:border-t-0 active:bg-gray-50"
    >
      <span>
        <span className="block font-medium text-gray-900">{rotulo}</span>
        {descricao && <span className="block text-sm text-gray-500">{descricao}</span>}
      </span>
      <span aria-hidden className="text-lg text-gray-400">
        ›
      </span>
    </Link>
  );
}
