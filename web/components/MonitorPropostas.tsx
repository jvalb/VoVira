"use client";

import { useEffect, useState } from "react";
import propostasData from "@/public/data/propostas.json";

export type EixoProposta =
  | "Economia e Trabalho"
  | "Social e Saúde"
  | "Educação e Ciência"
  | "Clima e Amazônia"
  | "Democracia e Soberania";

export type StatusProposta = "cumprida" | "andamento" | "nao_iniciada";

export interface Proposta {
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

const EIXOS: Array<"Todos" | EixoProposta> = [
  "Todos",
  "Economia e Trabalho",
  "Social e Saúde",
  "Educação e Ciência",
  "Clima e Amazônia",
  "Democracia e Soberania",
];

const STATUS_LABEL: Record<StatusProposta, string> = {
  cumprida: "Cumprida / Consolidada",
  andamento: "Em andamento",
  nao_iniciada: "Em articulação",
};

export const PROPOSTAS: Proposta[] = propostasData.propostas as Proposta[];

function formatarDataCurta(iso?: string): string {
  if (!iso) return "";
  const d = iso.slice(0, 10).split("-");
  if (d.length !== 3) return iso;
  return `${d[2]}/${d[1]}/${d[0]}`;
}

export default function MonitorPropostas() {
  const [propostas, setPropostas] = useState<Proposta[]>(PROPOSTAS);
  const [atualizadoEm, setAtualizadoEm] = useState<string>(propostasData.atualizadoEm);
  const [eixoAtivo, setEixoAtivo] = useState<"Todos" | EixoProposta>("Todos");
  const [statusFiltro, setStatusFiltro] = useState<"Todos" | StatusProposta>("Todos");

  useEffect(() => {
    let ativo = true;
    fetch("/api/propostas")
      .then((r) => (r.ok ? r.json() : null))
      .then((payload) => {
        if (!ativo || !payload || !Array.isArray(payload.propostas)) return;
        setPropostas(payload.propostas as Proposta[]);
        if (payload.atualizadoEm) setAtualizadoEm(payload.atualizadoEm);
      })
      .catch(() => {
        // Mantém fallback estático de public/data/propostas.json
      });
    return () => {
      ativo = false;
    };
  }, []);

  const totalCumpridas = propostas.filter((p) => p.status === "cumprida").length;
  const totalAndamento = propostas.filter((p) => p.status === "andamento").length;
  const totalArticulacao = propostas.filter((p) => p.status === "nao_iniciada").length;
  const mediaProgresso = Math.round(
    propostas.reduce((acc, p) => acc + p.progresso, 0) / (propostas.length || 1)
  );

  const visiveis = propostas.filter((p) => {
    if (eixoAtivo !== "Todos" && p.eixo !== eixoAtivo) return false;
    if (statusFiltro !== "Todos" && p.status !== statusFiltro) return false;
    return true;
  });

  return (
    <section className="secao-editorial secao-clara" id="propostas" aria-labelledby="propostas-titulo">
      <div className="secao-cab">
        <div>
          <p className="eyebrow eyebrow-esc">02 · Monitor Popular de Governo</p>
          <h2 id="propostas-titulo">Monitoramento das propostas de campanha</h2>
          <p className="secao-sub">
            A vitória nas urnas é o começo da cobrança popular. Os status abaixo são sincronizados automaticamente com a API de Dados Abertos da Câmara dos Deputados e indicadores oficiais (ou auditados internamente pela equipe).
          </p>
          <p className="propostas-sync-info">
            <span className="sync-ponto" aria-hidden="true" />
            Sincronização oficial ativa (API Câmara + BCB) · Última verificação:{" "}
            <strong>{formatarDataCurta(atualizadoEm)}</strong>
          </p>
        </div>

        <dl className="placar-propostas" aria-label="Resumo do cumprimento das propostas">
          <div className="pp-cumprida">
            <dt>Consolidadas</dt>
            <dd>{totalCumpridas}</dd>
          </div>
          <div className="pp-andamento">
            <dt>Em andamento</dt>
            <dd>{totalAndamento}</dd>
          </div>
          <div className="pp-articulacao">
            <dt>Em articulação</dt>
            <dd>{totalArticulacao}</dd>
          </div>
          <div className="pp-indice">
            <dt>Índice geral</dt>
            <dd>{mediaProgresso}%</dd>
          </div>
        </dl>
      </div>

      <div className="filtros-barra" role="region" aria-label="Filtros de propostas">
        <div className="filtro-grupo">
          <span className="filtro-rotulo">Eixo temático</span>
          <div className="seletor">
            {EIXOS.map((eixo) => (
              <button
                key={eixo}
                type="button"
                aria-pressed={eixoAtivo === eixo}
                onClick={() => setEixoAtivo(eixo)}
              >
                {eixo}
              </button>
            ))}
          </div>
        </div>

        <div className="filtro-grupo">
          <span className="filtro-rotulo">Estágio de execução</span>
          <div className="seletor">
            <button type="button" aria-pressed={statusFiltro === "Todos"} onClick={() => setStatusFiltro("Todos")}>
              Todas ({propostas.length})
            </button>
            <button type="button" aria-pressed={statusFiltro === "cumprida"} onClick={() => setStatusFiltro("cumprida")}>
              Consolidadas ({totalCumpridas})
            </button>
            <button type="button" aria-pressed={statusFiltro === "andamento"} onClick={() => setStatusFiltro("andamento")}>
              Em andamento ({totalAndamento})
            </button>
            <button type="button" aria-pressed={statusFiltro === "nao_iniciada"} onClick={() => setStatusFiltro("nao_iniciada")}>
              Em articulação ({totalArticulacao})
            </button>
          </div>
        </div>
      </div>

      <ul className="propostas-grade">
        {visiveis.map((p) => (
          <li key={p.id} className={`proposta-card status-${p.status}`}>
            <div className="proposta-topo">
              <span className="proposta-num">{p.num}</span>
              <span className="proposta-eixo">{p.eixo}</span>
              <span className={`proposta-status badge-${p.status}`}>
                {STATUS_LABEL[p.status]}
              </span>
            </div>

            <h3>{p.titulo}</h3>
            <p className="proposta-promessa">{p.promessa}</p>

            <div className="proposta-progresso">
              <div className="proposta-progresso-cab">
                <span>Execução aferida da meta</span>
                <strong>{p.progresso}%</strong>
              </div>
              <div className="b-trilho" aria-hidden="true">
                <span className={`b-preench preench-${p.status}`} style={{ width: `${p.progresso}%` }} />
              </div>
            </div>

            <div className="proposta-meta">
              <strong>Marco verificável:</strong> {p.metaIndicador}
            </div>

            {p.proposicaoCodigo && (
              <div className="proposta-tramitacao">
                <div className="pt-cab">
                  <span className="pt-cod">{p.proposicaoCodigo}</span>
                  {p.situacaoCamara && <span className="pt-sit">{p.situacaoCamara}</span>}
                </div>
                {p.urlFonte && (
                  <a
                    href={p.urlFonte}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pt-link"
                  >
                    Ficha oficial na Câmara {p.dataUltimaTramitacao ? `(${formatarDataCurta(p.dataUltimaTramitacao)})` : ""} ↗
                  </a>
                )}
              </div>
            )}

            <small className="proposta-fonte">Fonte de verificação: {p.fonteAcompanhamento}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}
