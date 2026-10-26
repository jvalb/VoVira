import { NextResponse } from "next/server";
import { store } from "@/lib/data";
import { gerarInsights } from "@/lib/insights";
import { ganhoMobilizacao, resumo, virada } from "@/lib/metrics";

export async function GET(_req: Request, ctx: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await ctx.params;
  const { municipios, zonas, meta } = store();
  const mun = municipios[codigo];
  if (!mun) return NextResponse.json({ erro: "município não encontrado" }, { status: 404 });
  const a26 = mun.e["2026t1"];
  return NextResponse.json({
    codigo,
    nome: mun.n,
    uf: mun.uf,
    pop: mun.pop,
    indicadores: mun.ind,
    referencias: { BR: meta.referencias.BR.ind, UF: meta.referencias.UF[mun.uf]?.ind ?? null },
    eleicoes: mun.e,
    uf2026t2: meta.ufs_2026t2?.[mun.uf] ?? null,
    candidatos: meta.candidatos,
    zonas: zonas[codigo] ?? {},
    analise: a26
      ? {
          virada: virada(resumo(a26).margem),
          ganhoMobilizacao10: ganhoMobilizacao(a26, 10),
        }
      : null,
    insights: gerarInsights({ mun, meta }),
  });
}
