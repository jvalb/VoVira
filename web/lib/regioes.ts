import { Agg, EKey, EKeyNacional, LULA, Municipio, OPONENTE } from "./types";

export type RegiaoId = "Nordeste" | "Sudeste" | "Sul" | "Norte" | "Centro-Oeste";

export interface DadosTurno {
  aptos: number;
  comp: number;
  abst: number;
  brancos: number;
  nulos: number;
  validos: number;
  lula: number;
  oponente: number;
}

export interface UfComparativo {
  uf: string;
  nome: string;
  municipios: number;
  eleicoes: Record<EKeyNacional, DadosTurno>;
}

export interface RegiaoComparativo {
  id: RegiaoId;
  nome: string;
  sigla: string;
  desc: string;
  municipios: number;
  eleicoes: Record<EKeyNacional, DadosTurno>;
  ufs: UfComparativo[];
}

export const UF_NOMES: Record<string, string> = {
  AC: "Acre",
  AL: "Alagoas",
  AM: "Amazonas",
  AP: "Amapá",
  BA: "Bahia",
  CE: "Ceará",
  DF: "Distrito Federal",
  ES: "Espírito Santo",
  GO: "Goiás",
  MA: "Maranhão",
  MG: "Minas Gerais",
  MS: "Mato Grosso do Sul",
  MT: "Mato Grosso",
  PA: "Pará",
  PB: "Paraíba",
  PE: "Pernambuco",
  PI: "Piauí",
  PR: "Paraná",
  RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte",
  RO: "Rondônia",
  RR: "Roraima",
  RS: "Rio Grande do Sul",
  SC: "Santa Catarina",
  SE: "Sergipe",
  SP: "São Paulo",
  TO: "Tocantins",
};

export const REGIOES_DEF: Array<{ id: RegiaoId; nome: string; sigla: string; desc: string; ufs: string[] }> = [
  {
    id: "Nordeste",
    nome: "Nordeste",
    sigla: "NE",
    desc: "9 estados · bastião decisivo da vitória, onde Lula alcançou 69,37% no 2º turno (+2,95 milhões de votos sobre o 1º turno).",
    ufs: ["AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE"],
  },
  {
    id: "Sudeste",
    nome: "Sudeste",
    sigla: "SE",
    desc: "4 estados · maior colégio eleitoral do país, onde Lula saltou +4,80 milhões de votos (+7,56 p.p.) entre o 1º e o 2º turno.",
    ufs: ["ES", "MG", "RJ", "SP"],
  },
  {
    id: "Sul",
    nome: "Sul",
    sigla: "S",
    desc: "3 estados · crescimento de +1,33 milhão de votos (+6,15 p.p.) para Lula no 2º turno nas regiões metropolitanas e interior.",
    ufs: ["PR", "RS", "SC"],
  },
  {
    id: "Norte",
    nome: "Norte",
    sigla: "N",
    desc: "7 estados · palco da virada histórica no 2º turno: Lula passou de 44,65% para 50,01%, vencendo na Amazônia.",
    ufs: ["AC", "AM", "AP", "PA", "RO", "RR", "TO"],
  },
  {
    id: "Centro-Oeste",
    nome: "Centro-Oeste",
    sigla: "CO",
    desc: "3 estados e o DF · avanço de +770,8 mil votos (+7,37 p.p.) para Lula entre o 1º e o 2º turno de 2026.",
    ufs: ["DF", "GO", "MS", "MT"],
  },
];

const EKEYS_MUN: EKey[] = ["2022t1", "2022t2", "2026t1"];
const ALL_EKEYS: EKeyNacional[] = ["2022t1", "2022t2", "2026t1", "2026t2"];

function zeroTurno(): DadosTurno {
  return { aptos: 0, comp: 0, abst: 0, brancos: 0, nulos: 0, validos: 0, lula: 0, oponente: 0 };
}

function somarAgg(dest: DadosTurno, orig?: Agg) {
  if (!orig) return;
  dest.aptos += orig.aptos;
  dest.comp += orig.comp;
  dest.abst += orig.abst;
  dest.brancos += orig.brancos;
  dest.nulos += orig.nulos;
  dest.validos += orig.validos;
  dest.lula += orig.v[LULA] ?? 0;
  dest.oponente += orig.v[OPONENTE] ?? 0;
}

/**
 * Agrega os inteiros oficiais do TSE de cada município nas 27 UFs e 5 macrorregiões do IBGE,
 * incorporando também os boletins estaduais oficiais do 2º turno de 2026 (TSE 6258).
 */
export function agregarPorRegiao(
  municipios: Record<string, Municipio>,
  ufs2026t2?: Record<string, Agg>
): RegiaoComparativo[] {
  const porUf: Record<string, UfComparativo> = {};
  for (const [uf, nome] of Object.entries(UF_NOMES)) {
    porUf[uf] = {
      uf,
      nome,
      municipios: 0,
      eleicoes: {
        "2022t1": zeroTurno(),
        "2022t2": zeroTurno(),
        "2026t1": zeroTurno(),
        "2026t2": zeroTurno(),
      },
    };
    if (ufs2026t2?.[uf]) {
      somarAgg(porUf[uf].eleicoes["2026t2"], ufs2026t2[uf]);
    }
  }

  for (const m of Object.values(municipios)) {
    const u = porUf[m.uf];
    if (!u) continue;
    u.municipios += 1;
    for (const ek of EKEYS_MUN) {
      somarAgg(u.eleicoes[ek], m.e[ek]);
    }
  }

  return REGIOES_DEF.map((r) => {
    const eleicoes: Record<EKeyNacional, DadosTurno> = {
      "2022t1": zeroTurno(),
      "2022t2": zeroTurno(),
      "2026t1": zeroTurno(),
      "2026t2": zeroTurno(),
    };
    let totalMun = 0;
    const ufs = r.ufs.map((sigla) => {
      const u = porUf[sigla];
      totalMun += u.municipios;
      for (const ek of ALL_EKEYS) {
        const d = eleicoes[ek];
        const o = u.eleicoes[ek];
        d.aptos += o.aptos;
        d.comp += o.comp;
        d.abst += o.abst;
        d.brancos += o.brancos;
        d.nulos += o.nulos;
        d.validos += o.validos;
        d.lula += o.lula;
        d.oponente += o.oponente;
      }
      return u;
    });
    return {
      id: r.id,
      nome: r.nome,
      sigla: r.sigla,
      desc: r.desc,
      municipios: totalMun,
      eleicoes,
      ufs,
    };
  });
}
