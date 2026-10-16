"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { METRICS, MetricKey, ResumoApi, metricByKey } from "@/lib/client-data";
import { ELECTION_LABEL, EKey, Agg, Meta } from "@/lib/types";
import Busca from "./Busca";
import BoasPraticas from "./BoasPraticas";
import Nacional from "./Nacional";
import Painel from "./Painel";
import Ranking from "./Ranking";

const MapView = dynamic(() => import("./MapView"), { ssr: false, loading: () => <div className="mapa-msg">Carregando mapa…</div> });

type Aba = "local" | "atuar" | "praticas";

const SEGUNDO_TURNO = new Date("2026-10-25T00:00:00-03:00");

export interface NacionalProps {
  nacional: Agg;
  candidatos: Meta["candidatos"]["2026t1"];
  totalizacao: string;
}

export default function App({ nacional }: { nacional: NacionalProps }) {
  const [resumo, setResumo] = useState<ResumoApi | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [eleicao, setEleicao] = useState<EKey>("2026t1");
  const [metricKey, setMetricKey] = useState<MetricKey>("margem");
  const [codigo, setCodigo] = useState<string | null>(null);
  const [aba, setAba] = useState<Aba>("local");
  const [foco, setFoco] = useState<{ codigo: string; n: number } | null>(null);
  const [dias, setDias] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/resumo")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j: ResumoApi) => {
        setResumo(j);
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const initialCode = params.get("m");
          if (initialCode && j.municipios[initialCode]) {
            setCodigo(initialCode);
            setAba("local");
            setFoco({ codigo: initialCode, n: 1 });
          }
        }
      })
      .catch((e: Error) => setErro(e.message));
    const d = Math.ceil((SEGUNDO_TURNO.getTime() - Date.now()) / 86_400_000);
    setDias(d);

    const onPopState = () => {
      const params = new URLSearchParams(window.location.search);
      const m = params.get("m");
      if (m) {
        setCodigo(m);
        setAba("local");
        setFoco((f) => ({ codigo: m, n: (f?.n ?? 0) + 1 }));
      } else {
        setCodigo(null);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const metric = metricByKey(metricKey);

  const abrir = useCallback((c: string, zoom: boolean) => {
    setCodigo(c);
    setAba("local");
    if (zoom) setFoco((f) => ({ codigo: c, n: (f?.n ?? 0) + 1 }));
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.get("m") !== c) {
        url.searchParams.set("m", c);
        window.history.pushState({ codigo: c }, "", url.toString());
      }
    }
  }, []);

  const voltarBrasil = useCallback(() => {
    setCodigo(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.has("m")) {
        url.searchParams.delete("m");
        window.history.pushState({}, "", url.toString());
      }
    }
  }, []);

  return (
    <div className="app">
      <header className="topo">
        <div className="marca">
          <h1>VoVira</h1>
          <p>Dados eleitorais oficiais, por localidade, para quem quer conversar e mobilizar.</p>
        </div>
        <Busca resumo={resumo} onPick={(c) => abrir(c, true)} />
        {dias != null && (
          <div className="contagem" aria-label="Contagem regressiva para o 2º turno">
            {dias > 0 ? (
              <>
                <strong>{dias}</strong> {dias === 1 ? "dia" : "dias"} para o 2º turno (25/10)
              </>
            ) : dias === 0 ? (
              <strong>2º turno é hoje</strong>
            ) : (
              <>2º turno já realizado</>
            )}
          </div>
        )}
      </header>

      <main className="grade">
        <section className="col-mapa" aria-label="Mapa">
          <div className="controles">
            <label>
              Mostrar
              <select value={metricKey} onChange={(e) => setMetricKey(e.target.value as MetricKey)}>
                {METRICS.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Eleição
              <select value={metric.fixaEleicao ? "2026t1" : eleicao} disabled={metric.fixaEleicao} onChange={(e) => setEleicao(e.target.value as EKey)}>
                {(Object.keys(ELECTION_LABEL) as EKey[]).map((k) => (
                  <option key={k} value={k}>
                    {ELECTION_LABEL[k]}
                  </option>
                ))}
              </select>
            </label>
            <p className="nota">{metric.desc}</p>
          </div>
          {erro && <p className="erro">Falha ao carregar dados: {erro}</p>}
          <MapView resumo={resumo} eleicao={metric.fixaEleicao ? "2026t1" : eleicao} metric={metric} selecionado={codigo} foco={foco} onSelect={(c) => abrir(c, false)} />
          <p className="nota rodape-mapa">
            Cada polígono é um município, e a área não é proporcional ao número de eleitores: cidades grandes aparecem pequenas. Use <em>Onde atuar</em> para ver onde há mais votos em jogo.
          </p>
        </section>

        <aside className="col-painel" aria-label="Detalhes">
          <nav className="abas" role="tablist" aria-label="Seções">
            <button role="tab" aria-selected={aba === "local"} onClick={() => setAba("local")}>
              {codigo ? "Localidade" : "Brasil"}
            </button>
            <button role="tab" aria-selected={aba === "atuar"} onClick={() => setAba("atuar")}>
              Onde atuar
            </button>
            <button role="tab" aria-selected={aba === "praticas"} onClick={() => setAba("praticas")}>
              Boas práticas
            </button>
          </nav>
          {aba === "local" && codigo && (
            <>
              <button className="voltar" onClick={voltarBrasil}>
                ← Ver Brasil
              </button>
              <Painel codigo={codigo} />
            </>
          )}
          {aba === "local" && !codigo && <Nacional meta={nacional} />}
          {aba === "atuar" && <Ranking onSelect={(c) => abrir(c, true)} />}
          {aba === "praticas" && <BoasPraticas />}
        </aside>
      </main>

      <footer className="rodape">
        Dados: TSE (Dados Abertos) e IBGE, sem alteração; percentuais calculados na hora.{" "}
        <Link href="/fontes">Fontes, metodologia e verificação (SHA-256)</Link>.
      </footer>
    </div>
  );
}
