import { describe, expect, it } from "vitest";
import { cenario, ganhoMobilizacao, pct, resumo, virada } from "./metrics";
import { Agg } from "./types";

const agg = (over: Partial<Agg> = {}): Agg => ({
  aptos: 1000,
  comp: 800,
  abst: 200,
  brancos: 20,
  nulos: 30,
  validos: 750,
  v: { "13": 300, "22": 350, "70": 60, "55": 40 },
  ...over,
});

describe("pct", () => {
  it("calcula e protege divisão por zero", () => {
    expect(pct(1, 4)).toBe(25);
    expect(pct(1, 0)).toBeNull();
  });
});

describe("resumo", () => {
  it("separa Lula, oponente e outros e calcula margem", () => {
    const r = resumo(agg());
    expect(r.lula).toBe(300);
    expect(r.oponente).toBe(350);
    expect(r.outros).toBe(100);
    expect(r.margem).toBe(-50);
    expect(r.lulaPct).toBeCloseTo(40, 10);
    expect(r.abstPct).toBeCloseTo(20, 10);
    expect(r.margemPp).toBeCloseTo((-50 / 750) * 100, 10);
  });
});

describe("virada", () => {
  it("atrás por 50: 51 votos novos ou 26 trocas", () => {
    expect(virada(-50)).toEqual({ novosVotos: 51, trocas: 26 });
  });
  it("trocas de fato invertem a margem: margem + 2*trocas >= 1", () => {
    for (const m of [-1, -2, -3, -10, -11, 0]) {
      const v = virada(m);
      expect(m + 2 * v.trocas).toBeGreaterThanOrEqual(1);
      expect(m + 2 * (v.trocas - 1)).toBeLessThan(1);
      expect(m + v.novosVotos).toBe(1);
    }
  });
  it("já à frente: nada a virar", () => {
    expect(virada(5)).toEqual({ novosVotos: 0, trocas: 0 });
  });
});

describe("cenario", () => {
  it("sem hipóteses nada muda", () => {
    const c = cenario(agg(), { mobilizarPct: 0, mobilizadosLula: 0.5, outrosLula: 0, outrosOponente: 0 });
    expect(c.margem).toBe(-50);
    expect(c.ganhoLula).toBe(0);
  });
  it("mobilizar 50% dos 200 abstencionistas, 60% para Lula", () => {
    const c = cenario(agg(), { mobilizarPct: 50, mobilizadosLula: 0.6, outrosLula: 0, outrosOponente: 0 });
    expect(c.ganhoLula).toBeCloseTo(60, 10);
    expect(c.ganhoOponente).toBeCloseTo(40, 10);
    expect(c.margem).toBeCloseTo(-30, 10);
  });
  it("outros candidatos: 30% Lula, 10% oponente de 100 eleitores", () => {
    const c = cenario(agg(), { mobilizarPct: 0, mobilizadosLula: 0.5, outrosLula: 0.3, outrosOponente: 0.1 });
    expect(c.lula).toBeCloseTo(330, 10);
    expect(c.oponente).toBeCloseTo(360, 10);
  });
  it("limita frações inválidas (outrosLula + outrosOponente <= 1)", () => {
    const c = cenario(agg(), { mobilizarPct: 0, mobilizadosLula: 0.5, outrosLula: 0.8, outrosOponente: 0.9 });
    expect(c.ganhoLula + c.ganhoOponente).toBeLessThanOrEqual(100 + 1e-9);
  });
});

describe("ganhoMobilizacao", () => {
  it("é positivo só onde Lula lidera o duelo", () => {
    expect(ganhoMobilizacao(agg())).toBeLessThan(0);
    expect(ganhoMobilizacao(agg({ v: { "13": 400, "22": 200 } }))).toBeGreaterThan(0);
  });
  it("10% de 200 abstenções com 2/3 para Lula = 20 * (2*2/3 - 1)", () => {
    expect(ganhoMobilizacao(agg({ v: { "13": 400, "22": 200 } }))).toBeCloseTo(20 * (1 / 3), 10);
  });
});
