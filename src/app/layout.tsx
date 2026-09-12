import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { NavegacaoPrincipal } from "@/components/navegacao-principal";
import { IndicadorConectividade } from "@/components/pwa/indicador-conectividade";
import { RegistrarServiceWorker } from "@/components/pwa/registrar-service-worker";
import "./globals.css";

// IBM Plex nasceu pra material técnico/de engenharia — combina com o tom
// "prancheta de campo" do sistema, e o Mono reforça leitura de dado
// numérico (profundidade, coordenada, vazão) sem parecer uma fonte
// genérica de SaaS.
const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Sistema de Relatórios de Poços",
  description: "Gestão e relatórios técnicos de poços tubulares",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Poços",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1c3f5f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${plexSans.variable} ${plexMono.variable} antialiased`}
      >
        <RegistrarServiceWorker />
        <IndicadorConectividade />
        <NavegacaoPrincipal />
        {children}
      </body>
    </html>
  );
}
