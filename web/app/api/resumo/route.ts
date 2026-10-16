import { NextResponse } from "next/server";
import { store } from "@/lib/data";
import { EKey } from "@/lib/types";

export const dynamic = "force-static";

const EKEYS: EKey[] = ["2022t1", "2022t2", "2026t1"];

/**
 * Resumo enxuto para colorir o mapa e buscar municípios.
 * Cada tupla traz SOMENTE inteiros do TSE: [lula, oponente, validos, aptos, abstencoes, brancos, nulos].
 * Percentuais são calculados pelo cliente.
 */
export function GET() {
  const { municipios } = store();
  const out: Record<string, unknown> = {};
  for (const [codigo, m] of Object.entries(municipios)) {
    const e: Record<string, number[]> = {};
    for (const k of EKEYS) {
      const a = m.e[k];
      if (a) e[k] = [a.v["13"] ?? 0, a.v["22"] ?? 0, a.validos, a.aptos, a.abst, a.brancos, a.nulos];
    }
    out[codigo] = { n: m.n, uf: m.uf, p: m.pop, e };
  }
  return NextResponse.json({ campos: ["lula", "oponente", "validos", "aptos", "abstencoes", "brancos", "nulos"], municipios: out });
}
