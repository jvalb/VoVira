export type EKey = "2022t1" | "2022t2" | "2026t1";
export type EKeyNacional = EKey | "2026t2";

export const ELECTION_LABEL: Record<EKey, string> = {
  "2022t1": "1º turno 2022",
  "2022t2": "2º turno 2022",
  "2026t1": "1º turno 2026",
};

/** Número de urna do candidato do campo que o app apoia e do principal adversário em cada eleição. */
export const LULA = "13";
export const OPONENTE = "22"; // Jair Bolsonaro (2022) / Flávio Bolsonaro (2026) — ver meta.candidatos

export interface Agg {
  aptos: number;
  comp: number;
  abst: number;
  brancos: number;
  nulos: number;
  validos: number;
  /** votos nominais por número de candidato (inteiros do TSE, sem alteração) */
  v: Record<string, number>;
}

export type IndKey = "alfabetizacao" | "esgoto_adequado" | "agua_rede" | "lixo_coletado" | "internet";
export type Indicators = Record<IndKey, number | null>;

export interface Municipio {
  n: string;
  uf: string;
  pop: number | null;
  ind: Indicators;
  e: Partial<Record<EKey, Agg>>;
}

export interface Referencia {
  pop: number | null;
  ind: Indicators;
}

export interface Meta {
  gerado_em_utc: string;
  eleicoes: Record<EKey, string> & Partial<Record<"2026t2", string>>;
  candidatos: Record<EKey, Record<string, { nome: string; partido: string }>> &
    Partial<Record<"2026t2", Record<string, { nome: string; partido: string }>>>;
  tse_arquivos: Record<EKey, { geracao: string; ultima_totalizacao: string }> &
    Partial<Record<"2026t2", { geracao: string; ultima_totalizacao: string }>>;
  nacional: Record<EKey, Agg> & Partial<Record<"2026t2", Agg>>;
  ufs_2026t2?: Record<string, Agg>;
  referencias: { BR: Referencia; UF: Record<string, Referencia> };
  exterior: Partial<Record<EKeyNacional, Agg>>;
  fontes: Record<string, { url: string; sha256: string; coletado_utc: string }>;
  formulas: Record<string, string>;
  validacoes: Record<string, boolean | number>;
}

export type ZonaRec = Agg;
export type Zonas = Record<string, Record<string, Partial<Record<EKey, ZonaRec>>>>;
