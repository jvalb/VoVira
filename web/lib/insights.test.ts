import { describe, expect, it } from "vitest";
import { gerarInsights } from "./insights";
import { Meta, Municipio } from "./types";

const mockMeta: Meta = {
  nacional: {
    "2026t1": {
      aptos: 156000000,
      comp: 123000000,
      abst: 33000000,
      brancos: 3000000,
      nulos: 4000000,
      validos: 116000000,
      v: { "13": 56000000, "22": 52000000, "70": 8000000 },
    },
    "2022t1": {
      aptos: 156000000,
      comp: 123000000,
      abst: 33000000,
      brancos: 3000000,
      nulos: 4000000,
      validos: 116000000,
      v: { "13": 57000000, "22": 51000000 },
    },
    "2022t2": {
      aptos: 156000000,
      comp: 124000000,
      abst: 32000000,
      brancos: 2000000,
      nulos: 4000000,
      validos: 118000000,
      v: { "13": 60000000, "22": 58000000 },
    },
  },
  candidatos: {
    "2026t1": {
      "13": { nome: "Luiz Inácio Lula da Silva", partido: "PT" },
      "22": { nome: "Flávio Bolsonaro", partido: "PL" },
      "70": { nome: "Candidato C", partido: "AVANTE" },
    },
    "2022t1": {
      "13": { nome: "Luiz Inácio Lula da Silva", partido: "PT" },
      "22": { nome: "Jair Bolsonaro", partido: "PL" },
    },
    "2022t2": {
      "13": { nome: "Luiz Inácio Lula da Silva", partido: "PT" },
      "22": { nome: "Jair Bolsonaro", partido: "PL" },
    },
  },
  referencias: {
    BR: {
      pop: 203000000,
      ind: {
        esgoto_adequado: 75.0,
        agua_rede: 85.0,
        lixo_coletado: 90.0,
        internet: 80.0,
        alfabetizacao: 93.0,
      },
    },
    UF: {
      SP: {
        pop: 44000000,
        ind: {
          esgoto_adequado: 92.0,
          agua_rede: 96.0,
          lixo_coletado: 98.0,
          internet: 88.0,
          alfabetizacao: 97.0,
        },
      },
    },
  },
  gerado_em_utc: "2026-10-04T22:00:00Z",
  eleicoes: {
    "2022t1": "1º turno 2022",
    "2022t2": "2º turno 2022",
    "2026t1": "1º turno 2026",
  },
  tse_arquivos: {
    "2026t1": { geracao: "2026-10-04", ultima_totalizacao: "2026-10-04T22:00:00-03:00" },
    "2022t1": { geracao: "2022-10-02", ultima_totalizacao: "2022-10-02" },
    "2022t2": { geracao: "2022-10-30", ultima_totalizacao: "2022-10-30" },
  },
  exterior: {},
  fontes: {},
  formulas: {},
  validacoes: {},
};

describe("gerarInsights", () => {
  it("gera insight de liderança quando Lula está à frente", () => {
    const mun: Municipio = {
      n: "São Paulo",
      uf: "SP",
      pop: 11451000,
      ind: {
        esgoto_adequado: 92.0,
        agua_rede: 96.0,
        lixo_coletado: 98.0,
        internet: 88.0,
        alfabetizacao: 97.0,
      },
      e: {
        "2026t1": {
          aptos: 9000000,
          comp: 7000000,
          abst: 2000000,
          brancos: 200000,
          nulos: 300000,
          validos: 6500000,
          v: { "13": 3500000, "22": 2800000, "70": 200000 },
        },
      },
    };

    const insights = gerarInsights({ mun, meta: mockMeta });
    const situacao = insights.find((i) => i.id === "situacao");
    expect(situacao).toBeDefined();
    expect(situacao?.titulo).toBe("Lula lidera nesta localidade");
    expect(situacao?.tipo).toBe("situacao");
  });

  it("gera insight de virada necessária quando Lula está atrás", () => {
    const mun: Municipio = {
      n: "São Paulo",
      uf: "SP",
      pop: 11451000,
      ind: {
        esgoto_adequado: 92.0,
        agua_rede: 96.0,
        lixo_coletado: 98.0,
        internet: 88.0,
        alfabetizacao: 97.0,
      },
      e: {
        "2026t1": {
          aptos: 9000000,
          comp: 7000000,
          abst: 2000000,
          brancos: 200000,
          nulos: 300000,
          validos: 6500000,
          v: { "13": 2800000, "22": 3500000, "70": 200000 },
        },
      },
    };

    const insights = gerarInsights({ mun, meta: mockMeta });
    const situacao = insights.find((i) => i.id === "situacao");
    expect(situacao).toBeDefined();
    expect(situacao?.titulo).toBe("Lula está atrás nesta localidade");
    expect(situacao?.fato).toContain("Para ficar à frente seriam necessários");
  });

  it("gera insight de abstenção alta quando supera a média nacional em 1.5 p.p.", () => {
    const mun: Municipio = {
      n: "Cidade com Alta Abstenção",
      uf: "SP",
      pop: 100000,
      ind: {
        esgoto_adequado: 80.0,
        agua_rede: 85.0,
        lixo_coletado: 90.0,
        internet: 80.0,
        alfabetizacao: 93.0,
      },
      e: {
        "2026t1": {
          aptos: 100000,
          comp: 60000,
          abst: 40000, // 40% abstention vs 21.15% national
          brancos: 2000,
          nulos: 3000,
          validos: 55000,
          v: { "13": 30000, "22": 25000 },
        },
      },
    };

    const insights = gerarInsights({ mun, meta: mockMeta });
    const abst = insights.find((i) => i.id === "abstencao");
    expect(abst).toBeDefined();
    expect(abst?.titulo).toBe("Abstenção acima da média nacional");
    expect(abst?.tipo).toBe("mobilizar");
  });

  it("gera insights de necessidade local quando indicadores do Censo 2022 estão abaixo da média", () => {
    const mun: Municipio = {
      n: "Cidade com Déficit de Saneamento",
      uf: "SP",
      pop: 50000,
      ind: {
        esgoto_adequado: 30.0, // BR is 75%, gap is 45 p.p.
        agua_rede: 50.0, // BR is 85%, gap is 35 p.p.
        lixo_coletado: 90.0,
        internet: 80.0,
        alfabetizacao: 93.0,
      },
      e: {
        "2026t1": {
          aptos: 40000,
          comp: 32000,
          abst: 8000,
          brancos: 1000,
          nulos: 1000,
          validos: 30000,
          v: { "13": 16000, "22": 14000 },
        },
      },
    };

    const insights = gerarInsights({ mun, meta: mockMeta });
    const esgoto = insights.find((i) => i.id === "necessidade-esgoto_adequado");
    expect(esgoto).toBeDefined();
    expect(esgoto?.titulo).toContain("Saneamento");
    expect(esgoto?.tipo).toBe("necessidade");
    expect(esgoto?.fonte.url).toContain("sidra.ibge.gov.br");
  });
});
