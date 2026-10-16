import { fInt, fPct, fPp } from "./format";
import { pct, resumo, virada } from "./metrics";
import { Agg, EKey, Indicators, Meta } from "./types";
import type { Insight } from "./insights";
import type { LinhaRanking, ModoRanking } from "./ranking";
import { MODOS } from "./ranking";

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
 * no WhatsApp / Telegram e materiais de apoio para militantes de campo (por município).
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

/**
 * Gera o roteiro nacional formatado para compartilhamento no WhatsApp
 * com as metas globais de virada e o potencial das abstenções no Brasil.
 */
export function formatarRoteiroNacional(agg: Agg, meta?: Meta | { totalizacao?: string }, urlOrigem?: string): string {
  const r = resumo(agg);
  const link = urlOrigem || "https://vovira.app";
  const v = virada(r.margem);

  const linhas: string[] = [];
  linhas.push(`📋 *VoVira — Guia de Mobilização Nacional (2º Turno 2026)*`);
  linhas.push(`📍 *Panorama Eleitoral Geral do Brasil (Dados Oficiais TSE)*`);
  linhas.push("");
  linhas.push(`🗳️ *Resultado Nacional do 1º Turno:*`);
  linhas.push(`• Lula: *${fPct(r.lulaPct)}* (${fInt(r.lula)} votos)`);
  linhas.push(`• Flávio Bolsonaro: *${fPct(r.oponentePct)}* (${fInt(r.oponente)} votos)`);
  linhas.push(`• Diferença: ${fInt(Math.abs(r.margem))} votos (${fPp(r.margemPp)})`);
  linhas.push(`• Abstenção: *${fPct(r.abstPct)}* (${fInt(agg.abst)} pessoas sem votar)`);
  linhas.push(`• Outros candidatos: ${fInt(r.outros)} votos (${fPct(pct(r.outros, r.validos))})`);
  linhas.push(`• Brancos e nulos: ${fInt(r.brancosNulos)} votos`);
  linhas.push("");
  linhas.push(`🎯 *A Matemática da Virada no Brasil:*`);
  if (r.margem < 0) {
    linhas.push(`• Votos novos necessários: *+${fInt(v.novosVotos)} votos* (entre quem se absteve, votou em branco/nulo ou em outros candidatos).`);
    linhas.push(`• OU conversões diretas: *${fInt(v.trocas)} eleitores trocando de lado*.`);
  } else {
    linhas.push(`• Lula lidera nacionalmente por ${fInt(r.margem)} votos.`);
  }
  linhas.push("");
  linhas.push(`💡 *Onde está o potencial da virada?*`);
  linhas.push(`1. *Mobilizar a abstenção:* 33,4 milhões de eleitores não compareceram no 1º turno. Mobilizar menos de 7% desse contingente já reverte a vantagem.`);
  linhas.push(`2. *Conversar com eleitores de outros candidatos:* mais de 9,3 milhões de votos disponíveis.`);
  linhas.push(`3. *Diálogo baseado em necessidades locais:* saneamento, água, coleta de lixo e conectividade pelo Censo 2022 do IBGE.`);
  linhas.push("");
  linhas.push(`⚖️ *Regras e Legislação Eleitoral (TSE):*`);
  linhas.push(`Diálogo respeitoso e propositivo. É crime eleitoral oferecer transporte, alimentação, dinheiro ou vantagens a eleitores (Lei 9.504/97). Não compartilhe desinformação.`);
  linhas.push("");
  linhas.push(`🔗 *Acesse o mapa interativo, diagnósticos municipais e simulador:*`);
  linhas.push(link);

  return linhas.join("\n");
}

/**
 * Formata lista de cidades prioritárias de uma estratégia para envio em grupos de coordenação.
 */
export function formatarRankingWhatsApp(
  itens: LinhaRanking[],
  modo: ModoRanking,
  uf?: string,
  urlOrigem?: string,
): string {
  const infoModo = MODOS[modo];
  const link = urlOrigem || "https://vovira.app";

  const linhas: string[] = [];
  linhas.push(`📋 *VoVira — Cidades Prioritárias para Atuação*`);
  linhas.push(`🎯 *Estratégia:* ${infoModo.titulo}${uf ? ` (${uf})` : " (Brasil)"}`);
  linhas.push(`ℹ️ _${infoModo.descricao}_`);
  linhas.push("");
  linhas.push(`🏆 *Top Cidades:*`);

  itens.slice(0, 15).forEach((item, idx) => {
    linhas.push(
      `${idx + 1}. *${item.nome} / ${item.uf}* — ${fInt(item.valor)} ${item.unidade} (Lula: ${fPct(item.lulaPct)} vs Opo: ${fPct(item.oponentePct)})`,
    );
  });

  linhas.push("");
  linhas.push(`🔗 *Consulte o mapa e roteiros completos:*`);
  linhas.push(link);

  return linhas.join("\n");
}
