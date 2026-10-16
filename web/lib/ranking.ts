import { ganhoMobilizacao, resumo } from "./metrics";
import { Municipio } from "./types";

export type ModoRanking = "mobilizacao" | "persuasao" | "recuperacao" | "equilibrio";

export interface LinhaRanking {
  codigo: string;
  nome: string;
  uf: string;
  /** valor usado para ordenar (veja `unidade`) */
  valor: number;
  unidade: string;
  lulaPct: number | null;
  oponentePct: number | null;
  margem: number;
  validos: number;
}

export const MODOS: Record<ModoRanking, { titulo: string; descricao: string; unidade: string }> = {
  mobilizacao: {
    titulo: "Maior ganho por mobilização",
    descricao:
      "Votos líquidos que Lula ganharia se 10% dos abstencionistas do 1º turno votassem, supondo que votem na mesma proporção Lula:oponente do 1º turno do município (hipótese). Só municípios onde Lula lidera.",
    unidade: "votos líquidos",
  },
  persuasao: {
    titulo: "Maior público de outros candidatos",
    descricao:
      "Eleitores que votaram, no 1º turno, em candidatos que não estão no 2º turno. É um público a conversar, não votos garantidos.",
    unidade: "eleitores",
  },
  recuperacao: {
    titulo: "Maior queda de votos vs. 2º turno de 2022",
    descricao:
      "Votos de Lula no 2º turno de 2022 menos votos de Lula no 1º turno de 2026. Compara turnos diferentes: parte da diferença é natural (no 2º turno os eleitores de outros candidatos se dividem).",
    unidade: "votos a menos",
  },
  equilibrio: {
    titulo: "Disputas mais apertadas (≥ 20 mil votos válidos)",
    descricao:
      "Municípios com menor diferença em pontos percentuais. Atenção: a eleição presidencial é decidida pelo total nacional; virar um município não vale mais que somar votos.",
    unidade: "p.p. de diferença",
  },
};

export function ranking(
  municipios: Record<string, Municipio>,
  modo: ModoRanking,
  opts: { uf?: string; limite?: number } = {},
): LinhaRanking[] {
  const { uf, limite = 30 } = opts;
  const linhas: LinhaRanking[] = [];
  for (const [codigo, m] of Object.entries(municipios)) {
    if (uf && m.uf !== uf) continue;
    const a26 = m.e["2026t1"];
    if (!a26) continue;
    const r = resumo(a26);
    let valor: number | null = null;
    switch (modo) {
      case "mobilizacao": {
        if (r.margem < 1) break;
        valor = ganhoMobilizacao(a26, 10);
        break;
      }
      case "persuasao":
        valor = r.outros;
        break;
      case "recuperacao": {
        const a22 = m.e["2022t2"];
        if (!a22) break;
        const queda = resumo(a22).lula - r.lula;
        valor = queda > 0 ? queda : null;
        break;
      }
      case "equilibrio": {
        if (a26.validos < 20000 || r.margemPp == null) break;
        valor = Math.abs(r.margemPp);
        break;
      }
    }
    if (valor == null || !Number.isFinite(valor)) continue;
    linhas.push({
      codigo,
      nome: m.n,
      uf: m.uf,
      valor,
      unidade: MODOS[modo].unidade,
      lulaPct: r.lulaPct,
      oponentePct: r.oponentePct,
      margem: r.margem,
      validos: a26.validos,
    });
  }
  linhas.sort((a, b) => (modo === "equilibrio" ? a.valor - b.valor : b.valor - a.valor));
  return linhas.slice(0, limite);
}
