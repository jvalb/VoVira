import { describe, expect, it } from "vitest";
import { ranking } from "./ranking";
import { Indicators, Municipio } from "./types";

const emptyInd: Indicators = {
  esgoto_adequado: null,
  agua_rede: null,
  lixo_coletado: null,
  internet: null,
  alfabetizacao: null,
};

const mockMuns: Record<string, Municipio> = {
  "1": {
    n: "Cidade A (Lula lidera folgado)",
    uf: "SP",
    pop: 100000,
    ind: emptyInd,
    e: {
      "2026t1": {
        aptos: 100000,
        comp: 80000,
        abst: 20000,
        brancos: 2000,
        nulos: 3000,
        validos: 75000,
        v: { "13": 50000, "22": 20000, "70": 5000 },
      },
      "2022t2": {
        aptos: 95000,
        comp: 80000,
        abst: 15000,
        brancos: 1000,
        nulos: 2000,
        validos: 77000,
        v: { "13": 55000, "22": 22000 }, // Queda de 5.000 votos
      },
    },
  },
  "2": {
    n: "Cidade B (Oponente lidera, muitos outros)",
    uf: "RJ",
    pop: 80000,
    ind: emptyInd,
    e: {
      "2026t1": {
        aptos: 80000,
        comp: 60000,
        abst: 20000,
        brancos: 2000,
        nulos: 3000,
        validos: 55000,
        v: { "13": 20000, "22": 23000, "70": 12000 }, // 12.000 outros
      },
    },
  },
  "3": {
    n: "Cidade C (Super equilibrada)",
    uf: "SP",
    pop: 50000,
    ind: emptyInd,
    e: {
      "2026t1": {
        aptos: 40000,
        comp: 32000,
        abst: 8000,
        brancos: 1000,
        nulos: 1000,
        validos: 30000,
        v: { "13": 15050, "22": 14950 }, // Margem de 100 votos em 30.000 validos (0,33 p.p.)
      },
    },
  },
  "4": {
    n: "Cidade Pequena (Menos de 20k válidos)",
    uf: "SP",
    pop: 8000,
    ind: emptyInd,
    e: {
      "2026t1": {
        aptos: 6000,
        comp: 5000,
        abst: 1000,
        brancos: 100,
        nulos: 100,
        validos: 4800,
        v: { "13": 2405, "22": 2395 }, // Super equilibrada mas pequena
      },
    },
  },
};

describe("ranking", () => {
  it("modo mobilização ordena por ganho e ignora onde Lula está atrás", () => {
    const res = ranking(mockMuns, "mobilizacao");
    expect(res.length).toBeGreaterThan(0);
    expect(res[0].codigo).toBe("1");
    // Cidade B (onde oponente lidera) não deve estar no ranking de mobilização
    expect(res.find((r) => r.codigo === "2")).toBeUndefined();
  });

  it("modo persuasão ordena pelo contingente de outros candidatos", () => {
    const res = ranking(mockMuns, "persuasao");
    expect(res[0].codigo).toBe("2");
    expect(res[0].valor).toBe(12000);
  });

  it("modo recuperação calcula queda em relação a 2022t2", () => {
    const res = ranking(mockMuns, "recuperacao");
    expect(res[0].codigo).toBe("1");
    expect(res[0].valor).toBe(5000); // 55.000 em 2022 vs 50.000 em 2026
  });

  it("modo equilíbrio filtra cidades com menos de 20 mil votos e ordena por menor diferença", () => {
    const res = ranking(mockMuns, "equilibrio");
    // Cidade 4 tem < 20.000 votos válidos, deve ser excluída
    expect(res.find((r) => r.codigo === "4")).toBeUndefined();
    expect(res[0].codigo).toBe("3");
    expect(res[0].valor).toBeCloseTo((100 / 30000) * 100, 2);
  });

  it("filtro por UF restringe os resultados", () => {
    const resRJ = ranking(mockMuns, "persuasao", { uf: "RJ" });
    expect(resRJ.every((r) => r.uf === "RJ")).toBe(true);
    expect(resRJ.length).toBe(1);
    expect(resRJ[0].codigo).toBe("2");
  });
});
