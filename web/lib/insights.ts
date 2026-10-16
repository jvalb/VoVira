import { fInt, fPct, fPp } from "./format";
import { pct, resumo, virada } from "./metrics";
import { Agg, IndKey, Meta, Municipio } from "./types";

export type TipoInsight = "situacao" | "mobilizar" | "persuadir" | "recuperar" | "necessidade";

export interface Insight {
  id: string;
  tipo: TipoInsight;
  titulo: string;
  /** frase com números oficiais (cada número vem de dado TSE/IBGE citado em `fonte`) */
  fato: string;
  fonte: { nome: string; url: string };
  /** sugestão de abordagem para conversa respeitosa com eleitores da localidade */
  conversa: string;
}

const TSE_FONTE = { nome: "TSE — Dados Abertos (votação por zona e detalhe da votação)", url: "https://dadosabertos.tse.jus.br/" };

interface Tema {
  titulo: string;
  tabela: number;
  /** diferença mínima (em p.p.) abaixo da referência nacional para sinalizar como necessidade */
  limiar: number;
  descreve: (valor: string) => string;
  conversa: string;
}

const PLANOS = "Os planos de governo de cada candidato estão registrados no DivulgaCandContas (TSE)";

const TEMAS: Record<IndKey, Tema> = {
  esgoto_adequado: {
    titulo: "Saneamento básico (esgoto)",
    tabela: 6805,
    limiar: 5,
    descreve: (v) => `${v} dos domicílios têm esgoto ligado à rede (rede geral, pluvial ou fossa ligada à rede)`,
    conversa: `Pergunte se o problema aparece no dia a dia (rua alagada, esgoto a céu aberto, doenças). ${PLANOS}: compare o que cada um propõe para saneamento e leve a comparação para a conversa, sem exagerar nem prometer o que não está lá.`,
  },
  agua_rede: {
    titulo: "Abastecimento de água",
    tabela: 6803,
    limiar: 5,
    descreve: (v) => `${v} dos domicílios usam a rede geral de água como forma principal de abastecimento`,
    conversa: `Pergunte como a família se abastece (poço, carro-pipa, rede) e se falta água. ${PLANOS}: compare o que cada candidato propõe para acesso à água.`,
  },
  lixo_coletado: {
    titulo: "Coleta de lixo",
    tabela: 6892,
    limiar: 3,
    descreve: (v) => `${v} dos domicílios têm o lixo coletado`,
    conversa: `Pergunte como o lixo é descartado no bairro e se o serviço chega. É um tema mais municipal: diferencie com honestidade o que depende da prefeitura e o que depende do governo federal (ex.: financiamento de saneamento).`,
  },
  internet: {
    titulo: "Conectividade (internet em casa)",
    tabela: 9936,
    limiar: 4,
    descreve: (v) => `${v} dos domicílios têm conexão domiciliar à Internet`,
    conversa: `Lembre que parte do eleitorado tem pouco acesso a informação online: conversas presenciais e materiais impressos legais (conforme regras do TSE) alcançam mais. Nunca compartilhe conteúdo que você não tenha verificado.`,
  },
  alfabetizacao: {
    titulo: "Alfabetização e escolaridade",
    tabela: 9543,
    limiar: 2,
    descreve: (v) => `a taxa de alfabetização de quem tem 15 anos ou mais é ${v}`,
    conversa: `Prefira linguagem simples, exemplos concretos e comparações oralmente. ${PLANOS}: o que cada um propõe para educação básica e educação de jovens e adultos?`,
  },
};

const fonteIbge = (t: number) => ({ nome: `IBGE — Censo Demográfico 2022, SIDRA tabela ${t}`, url: `https://sidra.ibge.gov.br/tabela/${t}` });

export interface InsightCtx {
  mun: Municipio;
  meta: Meta;
}

/** Gera insights determinísticos e rastreáveis a partir dos dados oficiais da localidade. */
export function gerarInsights({ mun, meta }: InsightCtx): Insight[] {
  const out: Insight[] = [];
  const a26 = mun.e["2026t1"];
  if (!a26) return out;
  const r26 = resumo(a26);
  const nac26 = meta.nacional["2026t1"];
  const rNac = resumo(nac26);
  const cand26 = meta.candidatos["2026t1"];

  // 1. Situação
  const v = virada(r26.margem);
  if (r26.margem >= 1) {
    out.push({
      id: "situacao",
      tipo: "situacao",
      titulo: "Lula lidera nesta localidade",
      fato: `Lula teve ${fPct(r26.lulaPct)} dos votos válidos e o oponente ${fPct(r26.oponentePct)}: vantagem de ${fInt(r26.margem)} votos (${fPp(r26.margemPp)}).`,
      fonte: TSE_FONTE,
      conversa: "O foco aqui é manter e ampliar a margem: lembrar quem já apoia de comparecer no 2º turno e conversar com quem ficou em dúvida.",
    });
  } else {
    out.push({
      id: "situacao",
      tipo: "situacao",
      titulo: r26.margem === 0 ? "Empate nesta localidade" : "Lula está atrás nesta localidade",
      fato: `Lula teve ${fPct(r26.lulaPct)} dos votos válidos e o oponente ${fPct(r26.oponentePct)}: diferença de ${fInt(Math.abs(r26.margem))} votos. Para ficar à frente seriam necessários ${fInt(v.novosVotos)} votos novos (de quem se absteve, votou em branco/nulo ou em outros candidatos) ou ${fInt(v.trocas)} eleitores trocando de lado.`,
      fonte: TSE_FONTE,
      conversa: "Compare os números com o tamanho do grupo que pode ser alcançado (abstenção e votos em outros candidatos, abaixo): é isso que mostra se a virada é plausível aqui.",
    });
  }

  // 2. Abstenção
  if (r26.abstPct != null && rNac.abstPct != null && r26.abstPct >= rNac.abstPct + 1.5) {
    out.push({
      id: "abstencao",
      tipo: "mobilizar",
      titulo: "Abstenção acima da média nacional",
      fato: `${fPct(r26.abstPct)} dos ${fInt(a26.aptos)} eleitores aptos não compareceram (média nacional: ${fPct(rNac.abstPct)}) — ${fInt(a26.abst)} pessoas.`,
      fonte: TSE_FONTE,
      conversa: "Conversar com quem não votou no 1º turno para entender o motivo (distância, trabalho, desânimo, título irregular). Informe com precisão local e horário de votação (e-Título / site do TSE). Atenção: oferecer transporte, refeição ou qualquer vantagem a eleitores é proibido pela legislação eleitoral.",
    });
  }

  // 3. Variação de Lula vs 1º turno de 2022
  const a22 = mun.e["2022t1"];
  if (a22) {
    const r22 = resumo(a22);
    if (r22.lulaPct != null && r26.lulaPct != null) {
      const d = r26.lulaPct - r22.lulaPct;
      if (d <= -2) {
        out.push({
          id: "recuperar",
          tipo: "recuperar",
          titulo: "Lula perdeu terreno em relação ao 1º turno de 2022",
          fato: `Lula teve ${fPct(r22.lulaPct)} dos válidos no 1º turno de 2022 e ${fPct(r26.lulaPct)} em 2026 (${fPp(d)}). Os campos de candidatos são diferentes nas duas eleições, então a comparação mostra tendência e não causa.`,
          fonte: TSE_FONTE,
          conversa: "Escute antes de argumentar: pergunte o que mudou na percepção das pessoas e quais temas pesam mais aqui. Use os temas de necessidade local abaixo como ponto de partida.",
        });
      }
    }
  }

  // 4. Votos em outros candidatos
  const outrosPct = pct(r26.outros, r26.validos);
  if (outrosPct != null && outrosPct >= 6) {
    const top = Object.entries(a26.v)
      .filter(([n]) => n !== "13" && n !== "22")
      .sort((x, y) => y[1] - x[1])
      .slice(0, 3)
      .filter(([, n]) => n > 0)
      .map(([n, votos]) => `${cand26[n]?.nome ?? n} (${fInt(votos)})`);
    out.push({
      id: "outros",
      tipo: "persuadir",
      titulo: "Eleitores sem candidato no 2º turno",
      fato: `${fPct(outrosPct)} dos votos válidos (${fInt(r26.outros)}) foram para outros candidatos${top.length ? `: ${top.join(", ")}` : ""}.`,
      fonte: TSE_FONTE,
      conversa: "Esses eleitores escolheram alguém que não está no 2º turno. Pergunte quais critérios pesaram na escolha deles e compare, com informação verificável, o que cada candidato do 2º turno propõe sobre esses pontos. Não assuma que votos migram automaticamente.",
    });
  }

  // 5. Necessidades locais (Censo 2022) em relação à referência nacional
  const ref = meta.referencias.BR;
  const refUf = meta.referencias.UF[mun.uf];
  const needs: { key: IndKey; gap: number }[] = [];
  (Object.keys(TEMAS) as IndKey[]).forEach((k) => {
    const val = mun.ind[k];
    const r = ref.ind[k];
    if (val == null || r == null) return;
    const gap = r - val;
    if (gap >= TEMAS[k].limiar) needs.push({ key: k, gap: gap / TEMAS[k].limiar });
  });
  needs.sort((x, y) => y.gap - x.gap);
  for (const { key } of needs.slice(0, 3)) {
    const t = TEMAS[key];
    const val = mun.ind[key]!;
    const refUfVal = refUf?.ind[key];
    out.push({
      id: `necessidade-${key}`,
      tipo: "necessidade",
      titulo: t.titulo,
      fato: `Em ${mun.n}, ${t.descreve(fPct(val))} — média nacional: ${fPct(ref.ind[key])}${refUfVal != null ? `; média de ${mun.uf}: ${fPct(refUfVal)}` : ""}.`,
      fonte: fonteIbge(t.tabela),
      conversa: t.conversa,
    });
  }
  return out;
}

export function resumoNacional(meta: Meta): { agg: Agg; r: ReturnType<typeof resumo> } {
  const agg = meta.nacional["2026t1"];
  return { agg, r: resumo(agg) };
}
