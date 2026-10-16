import { fInt, fPct } from "./format";
import { pct, resumo } from "./metrics";
import { Agg, EKey, Indicators } from "./types";
import type { Insight } from "./insights";

export interface DetalheCompartilhavel {
  codigo: string;
  nome: string;
  uf: string;
  pop: number | null;
  indicadores: Indicators;
  eleicoes: Partial<Record<EKey, Agg>>;
  analise: { virada: { novosVotos: number; trocas: number }; ganhoMobilizacao10: number } | null;
  insights: Insight[];
}

/**
 * Gera um roteiro textual formatado especificamente para compartilhamento
 * no WhatsApp / Telegram e materiais de apoio para militantes de campo.
 */
export function formatarRoteiroWhatsApp(d: DetalheCompartilhavel, urlOrigem?: string): string {
  const a26 = d.eleicoes["2026t1"];
  const r26 = a26 ? resumo(a26) : null;
  const link = urlOrigem || "https://vovira.app";

  const linhas: string[] = [];
  linhas.push(`📋 *VoVira — Guia de Mobilização e Diálogo*`);
  linhas.push(`📍 *${d.nome} / ${d.uf}*${d.pop != null ? ` (${fInt(d.pop)} hab. · Censo 2022)` : ""}`);
  linhas.push("");

  if (a26 && r26) {
    linhas.push(`🗳️ *Resultado do 1º Turno 2026:*`);
    linhas.push(`• Lula: *${fPct(r26.lulaPct)}* (${fInt(r26.lula)} votos)`);
    linhas.push(`• Oponente: *${fPct(r26.oponentePct)}* (${fInt(r26.oponente)} votos)`);
    linhas.push(`• Abstenção: ${fPct(r26.abstPct)} (${fInt(a26.abst)} pessoas)`);

    if (r26.outros > 0) {
      const outrosPct = pct(r26.outros, r26.validos);
      linhas.push(`• Outros candidatos: ${fPct(outrosPct)} (${fInt(r26.outros)} votos)`);
    }

    if (d.analise && d.analise.virada.novosVotos > 0) {
      linhas.push(`🎯 *Meta para virar:* +${fInt(d.analise.virada.novosVotos)} novos votos ou ${fInt(d.analise.virada.trocas)} conversões diretas.`);
    } else if (r26.margem > 0) {
      linhas.push(`🎯 *Vantagem atual:* +${fInt(r26.margem)} votos. Foco em consolidar presença e combater abstenção.`);
    }
    linhas.push("");
  }

  if (d.insights.length > 0) {
    linhas.push(`💡 *Pontos para conversar com eleitores (Dados Oficiais):*`);
    d.insights.forEach((ins, idx) => {
      linhas.push(`\n*${idx + 1}. ${ins.titulo}*`);
      linhas.push(`📊 _Dado oficial:_ ${ins.fato}`);
      linhas.push(`🗣️ _Como abordar:_ ${ins.conversa}`);
    });
    linhas.push("");
  }

  linhas.push(`⚖️ *Regras e Legislação Eleitoral (TSE):*`);
  linhas.push(`Diálogo respeitoso e propositivo. É crime eleitoral oferecer transporte, alimentação, dinheiro ou vantagens a eleitores (Lei 9.504/97). Não compartilhe desinformação.`);
  linhas.push("");
  linhas.push(`🔗 *Ver dados completos e simulador:*`);
  linhas.push(link);

  return linhas.join("\n");
}
