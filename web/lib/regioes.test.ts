import { describe, expect, it } from "vitest";
import { agregarPorRegiao } from "./regioes";
import { Municipio } from "./types";

describe("agregarPorRegiao", () => {
  it("soma exatamente os inteiros do TSE por UF e macrorregião", () => {
    const mock: Record<string, Municipio> = {
      "2611606": {
        n: "Recife",
        uf: "PE",
        pop: 1488920,
        ind: { alfabetizacao: 94, esgoto_adequado: 70, agua_rede: 90, lixo_coletado: 98, internet: 89 },
        e: {
          "2022t1": { aptos: 1200, comp: 1000, abst: 200, brancos: 20, nulos: 30, validos: 950, v: { "13": 550, "22": 350 } },
          "2022t2": { aptos: 1200, comp: 1020, abst: 180, brancos: 10, nulos: 10, validos: 1000, v: { "13": 600, "22": 400 } },
          "2026t1": { aptos: 1250, comp: 1050, abst: 200, brancos: 20, nulos: 30, validos: 1000, v: { "13": 580, "22": 390 } },
        },
      },
      "2927408": {
        n: "Salvador",
        uf: "BA",
        pop: 2417678,
        ind: { alfabetizacao: 95, esgoto_adequado: 80, agua_rede: 95, lixo_coletado: 97, internet: 90 },
        e: {
          "2022t1": { aptos: 2000, comp: 1600, abst: 400, brancos: 50, nulos: 50, validos: 1500, v: { "13": 1050, "22": 350 } },
          "2022t2": { aptos: 2000, comp: 1650, abst: 350, brancos: 25, nulos: 25, validos: 1600, v: { "13": 1150, "22": 450 } },
          "2026t1": { aptos: 2100, comp: 1700, abst: 400, brancos: 50, nulos: 50, validos: 1600, v: { "13": 1100, "22": 420 } },
        },
      },
    };

    const regioes = agregarPorRegiao(mock);
    const ne = regioes.find((r) => r.id === "Nordeste")!;
    expect(ne.municipios).toBe(2);
    expect(ne.eleicoes["2022t1"].lula).toBe(1600);
    expect(ne.eleicoes["2022t2"].lula).toBe(1750);
    expect(ne.eleicoes["2022t2"].validos).toBe(2600);

    const pe = ne.ufs.find((u) => u.uf === "PE")!;
    expect(pe.eleicoes["2022t2"].lula - pe.eleicoes["2022t1"].lula).toBe(50);
  });
});
