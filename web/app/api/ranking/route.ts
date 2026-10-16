import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/data";
import { MODOS, ModoRanking, ranking } from "@/lib/ranking";

export function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const modo = (p.get("modo") ?? "mobilizacao") as ModoRanking;
  if (!(modo in MODOS)) return NextResponse.json({ erro: "modo inválido", validos: Object.keys(MODOS) }, { status: 400 });
  const uf = p.get("uf")?.toUpperCase() || undefined;
  const limite = Math.min(100, Math.max(1, Number(p.get("limite") ?? 30) || 30));
  return NextResponse.json({
    modo,
    ...MODOS[modo],
    linhas: ranking(store().municipios, modo, { uf, limite }),
  });
}
