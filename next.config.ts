import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Padrão (~1MB) é pequeno demais pra foto de câmera de celular —
      // ver TAMANHO_MAXIMO_ANEXO_BYTES em src/lib/anexos/armazenamento.ts,
      // que já rejeita antes disso qualquer arquivo acima de 15MB.
      bodySizeLimit: "16mb",
    },
  },
};

export default nextConfig;
