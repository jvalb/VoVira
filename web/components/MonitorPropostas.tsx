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
export type EsferaProposta = "nacional" | "estadual";

export interface ApiAgrupada {
  id: string;
  nome: string;
  esfera: string;
  endpointBase: string;
  docsUrl: string;
  descricao: string;
}

export interface Proposta {
  id: string;
  num: string;
  esfera?: EsferaProposta;
  uf?: string;
  casaLegislativa?: string;
  titulo: string;
  eixo: EixoProposta;
  status: StatusProposta;
  progresso: number;
  regraAutomatica?: string;
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
export const APIS_AGRUPADAS: ApiAgrupada[] = (propostasData.apisAgrupadas ?? []) as ApiAgrupada[];

function formatarDataCurta(iso?: string): string {
  if (!iso) return "";
  const d = iso.slice(0, 10).split("-");
  if (d.length !== 3) return iso;
  return `${d[2]}/${d[1]}/${d[0]}`;
}

export default function MonitorPropostas() {
  const [propostas, setPropostas] = useState<Proposta[]>(PROPOSTAS);
  const [atualizadoEm, setAtualizadoEm] = useState<string>(propostasData.atualizadoEm);
  const [esferaAtiva, setEsferaAtiva] = useState<"Todas" | EsferaProposta>("Todas");
  const [eixoAtivo, setEixoAtivo] = useState<"Todos" | EixoProposta>("Todos");
  const [statusFiltro, setStatusFiltro] = useState<"Todos" | StatusProposta>("Todos");
  const [mostrarApis, setMostrarApis] = useState<boolean>(false);

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
        // Mantém fallback estático auditado de public/data/propostas.json
      });
    return () => {
      ativo = false;
    };
  }, []);

  const baseEsfera = propostas.filter((p) => {
    if (esferaAtiva === "Todas") return true;
    return (p.esfera ?? "nacional") === esferaAtiva;
  });

  const totalNacionais = propostas.filter((p) => (p.esfera ?? "nacional") === "nacional").length;
  const totalEstaduais = propostas.filter((p) => p.esfera === "estadual").length;

  const totalCumpridas = baseEsfera.filter((p) => p.status === "cumprida").length;
  const totalAndamento = baseEsfera.filter((p) => p.status === "andamento").length;
  const totalArticulacao = baseEsfera.filter((p) => p.status === "nao_iniciada").length;
  const mediaProgresso = Math.round(
    baseEsfera.reduce((acc, p) => acc + p.progresso, 0) / (baseEsfera.length || 1)
  );

  const visiveis = baseEsfera.filter((p) => {
    if (eixoAtivo !== "Todos" && p.eixo !== eixoAtivo) return false;
    if (statusFiltro !== "Todos" && p.status !== statusFiltro) return false;
    return true;
  });

  return (
    <section className="secao-editorial secao-clara" id="propostas" aria-labelledby="propostas-titulo">
      <div className="secao-cab">
        <div>
          <p className="eyebrow eyebrow-esc">02 · Monitor Popular · Escala Nacional & Estadual</p>
          <h2 id="propostas-titulo">Monitoramento de propostas e legislação</h2>
          <p className="secao-sub">
            Acompanhamento unificado em escala <strong>Nacional</strong> (Senado Federal, Congresso Nacional e Câmara dos Deputados) e <strong>Estadual</strong> (Assembleias Legislativas Estaduais via SAPL/Interlegis e ALMG), com verificação automatizada de veracidade e hash SHA-256 por proposição.
          </p>
          <div className="propostas-sync-linha">
            <p className="propostas-sync-info">
              <span className="sync-ponto" aria-hidden="true" />
              Veracidade auditada (Senado + Câmara + ALs Estaduais + BCB) · Última checagem:{" "}
              <strong>{formatarDataCurta(atualizadoEm)}</strong>
            </p>
            <button
              type="button"
              className="btn-apis-toggle"
              aria-expanded={mostrarApis}
              onClick={() => setMostrarApis((v) => !v)}
            >
              {mostrarApis ? "Ocultar APIs agrupadas ▲" : `Ver ${APIS_AGRUPADAS.length} APIs oficiais conectadas ▼`}
            </button>
          </div>
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

      {mostrarApis && (
        <div className="apis-painel" role="region" aria-label="APIs oficiais agrupadas">
          <div className="apis-painel-cab">
            <strong>Central de Dados Abertos Legislativos e Executivos (Nacional & Estadual)</strong>
            <span>Todas as proposições abaixo são validadas por testes automatizados de veracidade contra estas fontes primárias:</span>
          </div>
          <ul className="apis-grade">
            {APIS_AGRUPADAS.map((api) => (
              <li key={api.id} className="api-card">
                <div className="api-card-topo">
                  <span className={`api-esfera api-esfera-${api.esfera.toLowerCase()}`}>{api.esfera}</span>
                  <strong>{api.nome}</strong>
                </div>
                <p>{api.descricao}</p>
                <div className="api-card-rodape">
                  <code>{api.endpointBase}</code>
                  <a href={api.docsUrl} target="_blank" rel="noopener noreferrer">
                    Documentação / Swagger ↗
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="filtros-barra" role="region" aria-label="Filtros de propostas">
        <div className="filtro-grupo">
          <span className="filtro-rotulo">Escala federativa (Casa Legislativa)</span>
          <div className="seletor">
            <button
              type="button"
              aria-pressed={esferaAtiva === "Todas"}
              onClick={() => setEsferaAtiva("Todas")}
            >
              Todas as Esferas ({propostas.length})
            </button>
            <button
              type="button"
              aria-pressed={esferaAtiva === "nacional"}
              onClick={() => setEsferaAtiva("nacional")}
            >
              Nacional · Congresso, Câmara e Senado ({totalNacionais})
            </button>
            <button
              type="button"
              aria-pressed={esferaAtiva === "estadual"}
              onClick={() => setEsferaAtiva("estadual")}
            >
              Estadual · Assembleias Legislativas ({totalEstaduais})
            </button>
          </div>
        </div>

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
              Todas ({baseEsfera.length})
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
        {visiveis.map((p) => {
          const isEstadual = p.esfera === "estadual";
          return (
            <li key={p.id} className={`proposta-card status-${p.status}`}>
              <div className="proposta-topo">
                <span className="proposta-num">{p.num}</span>
                <span className={`proposta-esfera ${isEstadual ? "esfera-est" : "esfera-nac"}`}>
                  {isEstadual ? `Estadual · ${p.uf}` : "Nacional · BR"}
                </span>
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
                    {p.normaGerada ? (
                      <span className="pt-norma">{p.normaGerada}</span>
                    ) : (
                      p.situacaoCamara && <span className="pt-sit">{p.situacaoCamara}</span>
                    )}
                  </div>

                  {p.casaLegislativa && (
                    <div className="pt-casa">
                      <strong>Casa Legislativa:</strong> {p.casaLegislativa}
                    </div>
                  )}

                  {p.ementaOficial && (
                    <p className="pt-ementa" title={p.ementaOficial}>
                      “{p.ementaOficial.length > 145 ? `${p.ementaOficial.slice(0, 142)}...` : p.ementaOficial}”
                    </p>
                  )}

                  <div className="pt-links">
                    {p.urlFonte && (
                      <a
                        href={p.urlFonte}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pt-link"
                      >
                        {isEstadual ? `Ficha na Assembleia (${p.uf})` : "Ficha na Câmara"} ↗
                      </a>
                    )}
                    {p.urlSenado && (
                      <a
                        href={p.urlSenado}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pt-link"
                      >
                        Processo no Senado (JSON) ↗
                      </a>
                    )}
                    {isEstadual && p.apiEstadualUrl && (
                      <a
                        href={p.apiEstadualUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pt-link"
                      >
                        API Estadual ({p.uf}) ↗
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="proposta-rodape-veracidade">
                <small className="proposta-fonte">Fonte: {p.fonteAcompanhamento}</small>
                {p.sha256Verificacao && (
                  <code className="proposta-hash" title={`SHA-256 de verificação: ${p.sha256Verificacao}`}>
                    SHA-256: {p.sha256Verificacao.slice(0, 10)}
                  </code>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
