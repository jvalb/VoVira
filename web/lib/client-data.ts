import { pct } from "./metrics";
import { EKey } from "./types";

/** [lula, oponente, validos, aptos, abstencoes, brancos, nulos] — inteiros do TSE */
export type Tupla = number[];

export interface ResumoMun {
  n: string;
  uf: string;
  p: number | null;
  e: Partial<Record<EKey, Tupla>>;
}

export interface ResumoApi {
  campos: string[];
  municipios: Record<string, ResumoMun>;
}

export interface Stats {
  lula: number;
  opp: number;
  validos: number;
  aptos: number;
  abst: number;
  lulaPct: number | null;
  oppPct: number | null;
  abstPct: number | null;
  margemPp: number | null;
}

export function stats(t: Tupla | undefined): Stats | null {
  if (!t) return null;
  const [lula, opp, validos, aptos, abst] = t;
  return {
    lula,
    opp,
    validos,
    aptos,
    abst,
    lulaPct: pct(lula, validos),
    oppPct: pct(opp, validos),
    abstPct: pct(abst, aptos),
    margemPp: validos > 0 ? (100 * (lula - opp)) / validos : null,
  };
}

export type MetricKey = "lula" | "margem" | "abst" | "variacao";

export interface MetricDef {
  key: MetricKey;
  label: string;
  desc: string;
  /** paradas [valor, cor] da escala (valores fora são "presos" nas pontas) */
  stops: [number, string][];
  unit: string;
  /** se true, a métrica compara 2026 com 2022 e ignora o seletor de eleição */
  fixaEleicao?: boolean;
  value: (m: ResumoMun, e: EKey) => number | null;
}

export const METRICS: MetricDef[] = [
  {
    key: "lula",
    label: "Votos em Lula (% dos válidos)",
    desc: "Percentual de votos válidos de Lula no município.",
    unit: "%",
    stops: [
      [10, "#fee5d9"],
      [30, "#fcae91"],
      [45, "#fb6a4a"],
      [60, "#de2d26"],
      [80, "#a50f15"],
    ],
    value: (m, e) => stats(m.e[e])?.lulaPct ?? null,
  },
  {
    key: "margem",
    label: "Diferença Lula − oponente (p.p.)",
    desc: "Vermelho: Lula à frente. Azul: oponente à frente. Cinza claro: empate.",
    unit: "p.p.",
    stops: [
      [-60, "#08306b"],
      [-30, "#4292c6"],
      [-10, "#c6dbef"],
      [0, "#f0f0f0"],
      [10, "#fcbba1"],
      [30, "#ef3b2c"],
      [60, "#99000d"],
    ],
    value: (m, e) => stats(m.e[e])?.margemPp ?? null,
  },
  {
    key: "abst",
    label: "Abstenção (% dos aptos)",
    desc: "Eleitores aptos que não compareceram.",
    unit: "%",
    stops: [
      [10, "#f2f0f7"],
      [20, "#cbc9e2"],
      [30, "#9e9ac8"],
      [40, "#756bb1"],
      [50, "#54278f"],
    ],
    value: (m, e) => stats(m.e[e])?.abstPct ?? null,
  },
  {
    key: "variacao",
    label: "Variação de Lula: 1º turno 2026 vs 1º turno 2022 (p.p.)",
    desc: "Marrom: Lula perdeu terreno. Verde-azulado: ganhou. Os candidatos das duas eleições são diferentes.",
    unit: "p.p.",
    fixaEleicao: true,
    stops: [
      [-15, "#8c510a"],
      [-5, "#dfc27d"],
      [0, "#f5f5f5"],
      [5, "#80cdc1"],
      [15, "#01665e"],
    ],
    value: (m) => {
      const a = stats(m.e["2026t1"])?.lulaPct;
      const b = stats(m.e["2022t1"])?.lulaPct;
      return a != null && b != null ? a - b : null;
    },
  },
];

export const metricByKey = (k: MetricKey) => METRICS.find((m) => m.key === k)!;
