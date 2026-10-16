import type { Metadata, Viewport } from "next";
import "./fonts.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "VoVira — mapa eleitoral com dados oficiais",
  description:
    "Resultados oficiais do TSE por município e zona, com indicadores do IBGE, para apoiar conversas e mobilização de eleitores no 2º turno.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
