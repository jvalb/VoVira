import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export const revalidate = 3600; // Revalida automaticamente a cada 1 hora na Vercel (ISR)

export type EixoProposta =
  | "Economia e Trabalho"
  | "Social e Saúde"
  | "Educação e Ciência"
  | "Clima e Amazônia"
  | "Democracia e Soberania";

export type StatusProposta = "cumprida" | "andamento" | "nao_iniciada";

export interface PropostaItem {
  id: string;
  num: string;
  titulo: string;
  eixo: EixoProposta;
  status: StatusProposta;
  progresso: number;
  regraAutomatica?: "legislativa" | "hibrida";
  progressoExecucao?: number;
  overrideManual?: boolean;
  promessa: string;
  metaIndicador: string;
  fonteAcompanhamento: string;
  camaraId?: number;
  proposicaoCodigo?: string;
  urlFonte?: string;
  situacaoCamara?: string;
  ultimaTramitacao?: string;
  dataUltimaTramitacao?: string;
}

export interface PropostasPayload {
  atualizadoEm: string;
  metodoAtualizacao: string;
  indicadoresOficiais?: {
    salarioMinimoBCB?: { data: string; valor: string };
  };
  propostas: PropostaItem[];
}

function getPropostasPath(): string {
  return path.join(process.cwd(), "public", "data", "propostas.json");
}

function readLocalPropostas(): PropostasPayload {
  const filePath = getPropostasPath();
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as PropostasPayload;
}

function inferirStatus(
  situacao: string,
  regra: "legislativa" | "hibrida" = "hibrida",
  progressoExecucao?: number
): { status: StatusProposta; progresso: number } {
  const sit = (situacao || "").toLowerCase();
  const normaJuridica =
    sit.includes("norma jurídica") || sit.includes("promulgad") || sit.includes("sancionad");

  if (regra === "legislativa") {
    if (normaJuridica) return { status: "cumprida", progresso: 100 };
    if (
      sit.includes("pronta para pauta") ||
      sit.includes("plenário") ||
      sit.includes("senado") ||
      sit.includes("comissão")
    ) {
      return { status: "andamento", progresso: 55 };
    }
    if (sit.includes("aguardando parecer") || sit.includes("tramitando") || sit.includes("apensação")) {
      return { status: "nao_iniciada", progresso: 35 };
    }
    return { status: "nao_iniciada", progresso: 25 };
  }

  const prog = typeof progressoExecucao === "number" ? progressoExecucao : normaJuridica ? 90 : 50;
  if (prog >= 90 && normaJuridica) return { status: "cumprida", progresso: prog };
  if (prog >= 40 || normaJuridica) return { status: "andamento", progresso: prog };
  return { status: "nao_iniciada", progresso: prog };
}

async function consultarCamaraAoVivo(camaraId: number): Promise<{
  situacaoCamara: string;
  ultimaTramitacao: string;
  dataUltimaTramitacao: string;
} | null> {
  try {
    const res = await fetch(`https://dadosabertos.camara.leg.br/api/v2/proposicoes/${camaraId}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "VoVira-MonitorPropostas/1.0",
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const st = json?.dados?.statusProposicao;
    if (!st) return null;
    const situacao = st.descricaoSituacao || st.descricaoTramitacao || "Em tramitação";
    let despacho = String(st.despacho || st.descricaoTramitacao || situacao).trim();
    if (despacho.length > 160) {
      despacho = `${despacho.slice(0, 157).trimEnd()}...`;
    }
    const dataHora = String(st.dataHora || "").slice(0, 10);
    return {
      situacaoCamara: situacao,
      ultimaTramitacao: despacho,
      dataUltimaTramitacao: dataHora,
    };
  } catch {
    return null;
  }
}

export async function GET() {
  const payload = readLocalPropostas();

  const atualizadas = await Promise.all(
    payload.propostas.map(async (p) => {
      if (!p.camaraId) return p;
      const aoVivo = await consultarCamaraAoVivo(p.camaraId);
      if (!aoVivo) return p;

      const item: PropostaItem = {
        ...p,
        situacaoCamara: aoVivo.situacaoCamara,
        ultimaTramitacao: aoVivo.ultimaTramitacao,
        dataUltimaTramitacao: aoVivo.dataUltimaTramitacao || p.dataUltimaTramitacao,
      };

      if (!item.overrideManual) {
        const calc = inferirStatus(
          aoVivo.situacaoCamara,
          item.regraAutomatica ?? "hibrida",
          item.progressoExecucao
        );
        item.status = calc.status;
        item.progresso = calc.progresso;
      }

      return item;
    })
  );

  return NextResponse.json({
    ...payload,
    propostas: atualizadas,
  });
}

/**
 * Endpoint interno protegido por chave (VOVIRA_ADMIN_KEY) para atualização manual via API.
 * O usuário final nunca possui acesso a este endpoint na interface.
 */
export async function POST(req: NextRequest) {
  const adminKey = process.env.VOVIRA_ADMIN_KEY;
  const headerKey = req.headers.get("x-vovira-key");

  if (!adminKey || headerKey !== adminKey) {
    return NextResponse.json(
      { erro: "Acesso restrito ao administrador interno (VOVIRA_ADMIN_KEY)." },
      { status: 403 }
    );
  }

  const body = (await req.json()) as {
    id?: string;
    status?: StatusProposta;
    progresso?: number;
    metaIndicador?: string;
    overrideManual?: boolean;
  };

  if (!body.id) {
    return NextResponse.json({ erro: "Campo 'id' da proposta é obrigatório." }, { status: 400 });
  }

  const payload = readLocalPropostas();
  const idx = payload.propostas.findIndex((p) => p.id === body.id || p.num === body.id);
  if (idx === -1) {
    return NextResponse.json({ erro: `Proposta '${body.id}' não encontrada.` }, { status: 404 });
  }

  const alvo = payload.propostas[idx];
  if (body.status && ["cumprida", "andamento", "nao_iniciada"].includes(body.status)) {
    alvo.status = body.status;
  }
  if (typeof body.progresso === "number" && body.progresso >= 0 && body.progresso <= 100) {
    alvo.progresso = Math.round(body.progresso);
    if (alvo.regraAutomatica === "hibrida") {
      alvo.progressoExecucao = alvo.progresso;
    }
  }
  if (typeof body.metaIndicador === "string" && body.metaIndicador.trim()) {
    alvo.metaIndicador = body.metaIndicador.trim();
  }
  alvo.overrideManual = body.overrideManual ?? true;
  payload.atualizadoEm = new Date().toISOString();

  try {
    fs.writeFileSync(getPropostasPath(), `${JSON.stringify(payload, null, 2)}\n`, "utf-8");
  } catch {
    // Em ambiente serverless read-only (ex.: Vercel lambda), retorna o objeto validado
    // e orienta o uso do workflow/CLI para persistência em git.
  }

  return NextResponse.json({ ok: true, proposta: alvo, atualizadoEm: payload.atualizadoEm });
}
