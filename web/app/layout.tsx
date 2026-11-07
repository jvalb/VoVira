import type { Metadata, Viewport } from "next";
import "./fonts.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://web-blush-kappa-88.vercel.app"),
  title: "VoVira — Monitor Popular do Governo Lula, Mapa Eleitoral e Dados Oficiais",
  description:
    "Resultados oficiais do 1º e 2º turno de 2026 (TSE), monitor de propostas de campanha sincronizado com a Câmara dos Deputados, comparativo regional e indicadores do Censo IBGE 2022.",
  openGraph: {
    title: "VoVira — Vitória da Democracia, Monitor de Propostas e Mapa Eleitoral",
    description:
      "Acompanhe o cumprimento das 12 propostas centrais do novo mandato de Lula, o comparativo oficial entre 1º e 2º turno por região e os dados de todos os 5.570 municípios.",
    type: "website",
    locale: "pt_BR",
    siteName: "VoVira",
    images: [
      {
        url: "/img/hero.jpg",
        width: 1200,
        height: 800,
        alt: "VoVira — Monitor Popular e Inteligência Territorial",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VoVira — Monitor Popular do Governo Lula e Mapa Eleitoral (TSE/IBGE)",
    description:
      "Monitoramento de propostas de campanha, comparativo regional 1º × 2º turno e raio-x dos 5.570 municípios brasileiros.",
    images: ["/img/hero.jpg"],
  },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
