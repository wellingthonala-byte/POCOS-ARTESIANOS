import type { ReactNode } from "react";

// Cartão genérico usado pra agrupar seções da tela (perfil, relatório,
// zona de risco...) — título em caixa alta/rastreado remete a rótulo de
// prancheta técnica, não a um <h2> comum de formulário.
export function Cartao({
  titulo,
  corBorda = "border-gray-200",
  children,
}: {
  titulo?: string;
  corBorda?: string;
  children: ReactNode;
}) {
  return (
    <div className={`mt-6 rounded-sm border bg-white p-4 shadow-sm shadow-gray-900/5 ${corBorda}`}>
      {titulo && (
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
          {titulo}
        </h2>
      )}
      {children}
    </div>
  );
}
