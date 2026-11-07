import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export const revalidate = 3600; // Revalidação ISR a cada 1 hora na Vercel

export type EixoProposta =
  | "Economia e Trabalho"
  | "Social e Saúde"
  | "Educação e Ciência"
  | "Clima e Amazônia"
  | "Democracia e Soberania";

export type StatusProposta = "cumprida" | "andamento" | "nao_iniciada";
export type EsferaProposta = "nacional" | "estadual";

export interface ApiAgrupada {
  id: string;
  nome: string;
  esfera: string;
  endpointBase: string;
  docsUrl: string;
  descricao: string;
}

export interface PropostaItem {
  id: string;
  num: string;
  esfera?: EsferaProposta;
  uf?: string;
  casaLegislativa?: string;
  titulo: string;
  eixo: EixoProposta;
  status: StatusProposta;
  progresso: number;
  regraAutomatica?: "legislativa" | "hibrida" | "estadual_sapl" | "estadual_almg";
  progressoExecucao?: number;
  overrideManual?: boolean;
  promessa: string;
  metaIndicador: string;
  fonteAcompanhamento: string;
  camaraId?: number;
  senadoId?: number;
  proposicaoCodigo?: string;
  apiEstadualUrl?: string;
  urlFonte?: string;
  urlSenado?: string;
  situacaoCamara?: string;
  situacaoSenado?: string;
  normaGerada?: string;
  ultimaTramitacao?: string;
  dataUltimaTramitacao?: string;
  ementaOficial?: string;
  sha256Verificacao?: string;
}

export interface PropostasPayload {
  atualizadoEm: string;
  metodoAtualizacao: string;
  apisAgrupadas?: ApiAgrupada[];
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
  regra: PropostaItem["regraAutomatica"] = "hibrida",
  progressoExecucao?: number,
  normaGerada = ""
): { status: StatusProposta; progresso: number } {
  const sit = `${situacao || ""} ${normaGerada || ""}`.toLowerCase();
  const normaJuridica =
    sit.includes("norma jurídica") ||
    sit.includes("lei nº") ||
    sit.includes("lei ordinária") ||
    sit.includes("lei complementar") ||
    sit.includes("emenda constitucional") ||
    sit.includes("promulgad") ||
    sit.includes("sancionad");

  if (regra === "legislativa" || regra === "estadual_sapl") {
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

  if (regra === "estadual_almg") {
    if (normaJuridica) return { status: "cumprida", progresso: 100 };
    return { status: "andamento", progresso: progressoExecucao ?? 55 };
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
        "User-Agent": "VoVira-VeracidadeLegislativa/2.0",
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

async function consultarSenadoAoVivo(senadoId: number): Promise<{
  situacaoSenado: string;
  normaGerada: string;
} | null> {
  try {
    const res = await fetch(`https://legis.senado.leg.br/dadosabertos/processo/${senadoId}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "VoVira-VeracidadeLegislativa/2.0",
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const d = await res.json();
    const normaRaw = d?.normaGerada;
    const norma =
      typeof normaRaw === "object" && normaRaw !== null
        ? String(normaRaw.descricao || "").trim()
        : String(normaRaw || "").trim();
    const casa = String(d?.casaIdentificadora || "SF").trim();
    const sitAtual = String(d?.situacaoAtual || "").trim();
    const situacaoSenado = norma
      ? `Sancionada / Promulgada: ${norma}`
      : sitAtual
      ? `${sitAtual} (${casa})`
      : `Processo no ${casa}`;
    return {
      situacaoSenado,
      normaGerada: norma,
    };
  } catch {
    return null;
  }
}

async function consultarEstadualAoVivo(
  url: string,
  regra: PropostaItem["regraAutomatica"]
): Promise<{
  situacaoCamara: string;
  ultimaTramitacao: string;
  dataUltimaTramitacao?: string;
  normaGerada?: string;
} | null> {
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "VoVira-VeracidadeLegislativa/2.0",
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const d = await res.json();
    if (regra === "estadual_almg" || d?.resultado) {
      const item = d?.resultado?.listaItem?.[0];
      if (!item) return null;
      const ementa = String(item.ementa || "").replace(/\s+/g, " ").trim();
      const sit = String(item.situacao || "Em tramitação na ALMG").trim();
      return {
        situacaoCamara: `${sit} (ALMG)`,
        ultimaTramitacao: ementa.slice(0, 160),
      };
    }
    const normaStr = String(d?.__str__ || "").trim();
    const ementa = String(d?.ementa || "").replace(/\s+/g, " ").trim();
    const dataPub = String(d?.data || "").slice(0, 10);
    return {
      situacaoCamara: "Norma Jurídica Estadual Vigente",
      ultimaTramitacao: ementa ? ementa.slice(0, 160) : normaStr,
      dataUltimaTramitacao: dataPub || undefined,
      normaGerada: normaStr || undefined,
    };
  } catch {
    return null;
  }
}

export async function GET() {
  const payload = readLocalPropostas();

  const atualizadas = await Promise.all(
    payload.propostas.map(async (p) => {
      const item: PropostaItem = { ...p };

      if (item.esfera === "estadual" && item.apiEstadualUrl) {
        const est = await consultarEstadualAoVivo(item.apiEstadualUrl, item.regraAutomatica);
        if (est) {
          item.situacaoCamara = est.situacaoCamara;
          item.ultimaTramitacao = est.ultimaTramitacao;
          if (est.dataUltimaTramitacao) item.dataUltimaTramitacao = est.dataUltimaTramitacao;
          if (est.normaGerada) item.normaGerada = est.normaGerada;
        }
      } else {
        const [camara, senado] = await Promise.all([
          item.camaraId ? consultarCamaraAoVivo(item.camaraId) : Promise.resolve(null),
          item.senadoId ? consultarSenadoAoVivo(item.senadoId) : Promise.resolve(null),
        ]);
        if (camara) {
          item.situacaoCamara = camara.situacaoCamara;
          item.ultimaTramitacao = camara.ultimaTramitacao;
          if (camara.dataUltimaTramitacao) item.dataUltimaTramitacao = camara.dataUltimaTramitacao;
        }
        if (senado) {
          item.situacaoSenado = senado.situacaoSenado;
          if (senado.normaGerada) item.normaGerada = senado.normaGerada;
        }
      }

      if (!item.overrideManual) {
        const calc = inferirStatus(
          item.situacaoCamara || "",
          item.regraAutomatica ?? "hibrida",
          item.progressoExecucao,
          item.normaGerada || ""
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
    // Em ambiente serverless read-only, preserva retorno validado.
  }

  return NextResponse.json({ ok: true, proposta: alvo, atualizadoEm: payload.atualizadoEm });
}
