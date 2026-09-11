import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NavegacaoPrincipal } from "@/components/navegacao-principal";
import { IndicadorConectividade } from "@/components/pwa/indicador-conectividade";
import { RegistrarServiceWorker } from "@/components/pwa/registrar-service-worker";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
  themeColor: "#1a56c4",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <RegistrarServiceWorker />
        <IndicadorConectividade />
        <NavegacaoPrincipal />
        {children}
      </body>
    </html>
  );
}
