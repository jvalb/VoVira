import { describe, expect, it } from "vitest";
import { formatarRoteiroWhatsApp, DetalheCompartilhavel } from "./share";

const mockDetalheTrailing: DetalheCompartilhavel = {
  codigo: "3550308",
  nome: "São Paulo",
  uf: "SP",
  pop: 11451245,
  indicadores: {
    esgoto_adequado: 92.5,
    agua_rede: 98.1,
    lixo_coletado: 99.0,
    internet: 88.5,
    alfabetizacao: 96.8,
  },
  eleicoes: {
    "2026t1": {
      aptos: 9000000,
      comp: 7000000,
      abst: 2000000,
      brancos: 200000,
      nulos: 300000,
      validos: 6500000,
      v: {
        "13": 3000000, // Lula
        "22": 3200000, // Oponente (leading by 200,000)
        "70": 300000,
      },
    },
  },
  analise: {
    virada: { novosVotos: 200001, trocas: 100001 },
    ganhoMobilizacao10: -10000,
  },
  insights: [
    {
      id: "situacao",
      tipo: "situacao",
      titulo: "Lula está atrás nesta localidade",
      fato: "Lula teve 46,15% e o oponente 49,23%.",
      fonte: { nome: "TSE", url: "https://dadosabertos.tse.jus.br/" },
      conversa: "Converse com foco nos indecisos.",
    },
    {
      id: "necessidade-esgoto_adequado",
      tipo: "necessidade",
      titulo: "Saneamento básico",
      fato: "Em São Paulo, 92,5% dos domicílios têm esgoto ligado à rede.",
      fonte: { nome: "IBGE", url: "https://sidra.ibge.gov.br/" },
      conversa: "Aborde as propostas de saneamento com seriedade.",
    },
  ],
};

const mockDetalheLeading: DetalheCompartilhavel = {
  codigo: "2927408",
  nome: "Salvador",
  uf: "BA",
  pop: 2418005,
  indicadores: {
    esgoto_adequado: 85.0,
    agua_rede: 95.0,
    lixo_coletado: 97.0,
    internet: 82.0,
    alfabetizacao: 94.0,
  },
  eleicoes: {
    "2026t1": {
      aptos: 1900000,
      comp: 1500000,
      abst: 400000,
      brancos: 40000,
      nulos: 60000,
      validos: 1400000,
      v: {
        "13": 950000, // Lula (leading by 550,000)
        "22": 400000,
        "70": 50000,
      },
    },
  },
  analise: {
    virada: { novosVotos: 0, trocas: 0 },
    ganhoMobilizacao10: 25000,
  },
  insights: [],
};

describe("formatarRoteiroWhatsApp", () => {
  it("formata texto com metas de virada quando Lula está atrás", () => {
    const txt = formatarRoteiroWhatsApp(mockDetalheTrailing, "https://vovira.app/?m=3550308");

    expect(txt).toContain("📋 *VoVira — Guia de Mobilização e Diálogo*");
    expect(txt).toContain("📍 *São Paulo / SP* (11.451.245 hab. · Censo 2022)");
    expect(txt).toContain("Lula: *46,15%* (3.000.000 votos)");
    expect(txt).toContain("Oponente: *49,23%* (3.200.000 votos)");
    expect(txt).toContain("Meta para virar:* +200.001 novos votos ou 100.001 conversões diretas");
    expect(txt).toContain("Saneamento básico");
    expect(txt).toContain("Lei 9.504/97");
    expect(txt).toContain("https://vovira.app/?m=3550308");
  });

  it("formata texto com consolidação de vantagem quando Lula lidera", () => {
    const txt = formatarRoteiroWhatsApp(mockDetalheLeading, "https://vovira.app/?m=2927408");

    expect(txt).toContain("📍 *Salvador / BA* (2.418.005 hab. · Censo 2022)");
    expect(txt).toContain("Lula: *67,86%* (950.000 votos)");
    expect(txt).toContain("Vantagem atual:* +550.000 votos");
    expect(txt).toContain("Lei 9.504/97");
    expect(txt).toContain("https://vovira.app/?m=2927408");
  });
});
