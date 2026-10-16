import { Agg, LULA, OPONENTE } from "./types";

/** Percentual de n sobre d (0–100), ou null quando d == 0. Nunca é gravado em disco. */
export function pct(n: number, d: number): number | null {
  return d > 0 ? (100 * n) / d : null;
}

export interface Resumo {
  lula: number;
  oponente: number;
  outros: number; // votos válidos em candidatos que não são Lula nem o oponente
  validos: number;
  lulaPct: number | null; // % dos votos válidos
  oponentePct: number | null;
  abstPct: number | null; // % dos aptos
  brancosNulos: number;
  margem: number; // Lula − oponente, em votos
  margemPp: number | null; // em pontos percentuais dos válidos
}

export function resumo(a: Agg): Resumo {
  const lula = a.v[LULA] ?? 0;
  const oponente = a.v[OPONENTE] ?? 0;
  return {
    lula,
    oponente,
    outros: a.validos - lula - oponente,
    validos: a.validos,
    lulaPct: pct(lula, a.validos),
    oponentePct: pct(oponente, a.validos),
    abstPct: pct(a.abst, a.aptos),
    brancosNulos: a.brancos + a.nulos,
    margem: lula - oponente,
    margemPp: a.validos > 0 ? (100 * (lula - oponente)) / a.validos : null,
  };
}

export interface Virada {
  /** votos NOVOS para Lula (vindos de abstenção, brancos/nulos ou terceiros) para ficar 1 voto à frente */
  novosVotos: number;
  /** eleitores do oponente que precisam trocar de lado para ficar 1 voto à frente (cada troca muda a margem em 2) */
  trocas: number;
}

/** Quantos votos faltam para virar o município. Se Lula já está à frente, retorna zeros. */
export function virada(margem: number): Virada {
  if (margem >= 1) return { novosVotos: 0, trocas: 0 };
  return { novosVotos: 1 - margem, trocas: Math.ceil((1 - margem) / 2) };
}

export interface CenarioParams {
  /** % dos abstencionistas do 1º turno que passam a votar (0–100) */
  mobilizarPct: number;
  /** fração (0–1) dos mobilizados que votam em Lula; o restante vota no oponente */
  mobilizadosLula: number;
  /** fração (0–1) dos eleitores de OUTROS candidatos que votam em Lula no 2º turno */
  outrosLula: number;
  /** fração (0–1) dos eleitores de OUTROS candidatos que votam no oponente (outrosLula + outrosOponente ≤ 1) */
  outrosOponente: number;
}

export interface CenarioResultado {
  lula: number;
  oponente: number;
  margem: number;
  ganhoLula: number;
  ganhoOponente: number;
}

/**
 * Cenário ILUSTRATIVO (não é previsão). Parte dos votos do 1º turno de Lula e do oponente e soma:
 *  - abstencionistas mobilizados, divididos conforme `mobilizadosLula`;
 *  - eleitores de outros candidatos, divididos conforme `outrosLula` / `outrosOponente`.
 * Todas as hipóteses são parâmetros explícitos do usuário.
 */
export function cenario(a: Agg, p: CenarioParams): CenarioResultado {
  const r = resumo(a);
  const mob = (a.abst * clamp(p.mobilizarPct, 0, 100)) / 100;
  const ol = clamp(p.outrosLula, 0, 1);
  const oo = clamp(p.outrosOponente, 0, 1 - ol);
  const ml = clamp(p.mobilizadosLula, 0, 1);
  const ganhoLula = mob * ml + r.outros * ol;
  const ganhoOponente = mob * (1 - ml) + r.outros * oo;
  const lula = r.lula + ganhoLula;
  const oponente = r.oponente + ganhoOponente;
  return { lula, oponente, margem: lula - oponente, ganhoLula, ganhoOponente };
}

/** Proporção de Lula no total de votos dos dois principais candidatos (0–1); 0.5 se ambos têm 0. */
export function fracaoLulaDuelo(a: Agg): number {
  const r = resumo(a);
  const t = r.lula + r.oponente;
  return t > 0 ? r.lula / t : 0.5;
}

/**
 * Ganho líquido de margem (votos) se `pct`% dos abstencionistas passassem a votar, supondo que
 * votem na mesma proporção Lula:oponente do 1º turno do próprio município. Hipótese explícita.
 */
export function ganhoMobilizacao(a: Agg, pctMobilizado = 10): number {
  const f = fracaoLulaDuelo(a);
  return (a.abst * pctMobilizado) / 100 * (2 * f - 1);
}

export function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}
