"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { METRICS, MetricKey, ResumoApi, metricByKey } from "@/lib/client-data";
import { RegiaoComparativo } from "@/lib/regioes";
import { ELECTION_LABEL, EKey, Agg, Meta } from "@/lib/types";
import Busca from "./Busca";
import BoasPraticas from "./BoasPraticas";
import ComparativoRegional from "./ComparativoRegional";
import EsquerdaRadical from "./EsquerdaRadical";
import Hero, { Destino } from "./Hero";
import MonitorPropostas from "./MonitorPropostas";
import Nacional from "./Nacional";
import Painel from "./Painel";
import Ranking from "./Ranking";

const MapView = dynamic(() => import("./MapView"), { ssr: false, loading: () => <div className="mapa-msg">Carregando mapa…</div> });

type Aba = "local" | "atuar" | "praticas";
type SecaoAtiva = "inicio" | "propostas" | "regioes" | "esquerda" | "mapa" | "atuar" | "praticas";

const SEGUNDO_TURNO = new Date("2026-10-25T00:00:00-03:00");

export interface NacionalProps {
  nacional: Agg;
  candidatos: Meta["candidatos"]["2026t1"];
  totalizacao: string;
  municipiosMapeados?: number;
}

export default function App({
  nacional,
  regioes = [],
}: {
  nacional: NacionalProps;
  regioes?: RegiaoComparativo[];
}) {
  const [resumo, setResumo] = useState<ResumoApi | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [eleicao, setEleicao] = useState<EKey>("2026t1");
  const [metricKey, setMetricKey] = useState<MetricKey>("margem");
  const [codigo, setCodigo] = useState<string | null>(null);
  const [aba, setAba] = useState<Aba>("local");
  const [foco, setFoco] = useState<{ codigo: string; n: number } | null>(null);
  const [dias, setDias] = useState<number | null>(null);
  const [secaoScroll, setSecaoScroll] = useState<"inicio" | "propostas" | "regioes" | "esquerda" | "mapa">("inicio");

  useEffect(() => {
    fetch("/api/resumo")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j: ResumoApi) => {
        setResumo(j);
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const initialAba = params.get("aba");
          if (initialAba === "atuar" || initialAba === "praticas" || initialAba === "local") {
            setAba(initialAba);
          }
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

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY + 110 + window.innerHeight * 0.25;
      const ids: Array<{ id: string; sec: "propostas" | "regioes" | "esquerda" | "mapa" }> = [
        { id: "mapa", sec: "mapa" },
        { id: "esquerda", sec: "esquerda" },
        { id: "regioes", sec: "regioes" },
        { id: "propostas", sec: "propostas" },
      ];
      for (const item of ids) {
        const el = document.getElementById(item.id);
        if (el && y >= el.offsetTop) {
          setSecaoScroll(item.sec);
          return;
        }
      }
      setSecaoScroll("inicio");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const secao: SecaoAtiva =
    secaoScroll === "mapa" ? (aba === "local" ? "mapa" : aba) : secaoScroll;
  const cur = (k: SecaoAtiva) => ({
    className: secao === k ? "ativo" : undefined,
    "aria-current": secao === k ? ("true" as const) : undefined,
  });

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

  const rolarPara = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const irPara = (d: Destino) => {
    if (d === "propostas" || d === "regioes" || d === "esquerda") {
      rolarPara(d);
      return;
    }
    setAba(d);
    rolarPara("mapa");
  };

  return (
    <div className="app">
      <a className="pular" href="#propostas">
        Pular para o conteúdo
      </a>
      <header className="topo">
        <button type="button" className="logo" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="VoVira, voltar ao início">
          Vo<span>Vira</span>
        </button>
        <nav className="menu" aria-label="Principal">
          <button type="button" {...cur("inicio")} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <i>01</i>Início
          </button>
          <button type="button" {...cur("propostas")} onClick={() => rolarPara("propostas")}>
            <i>02</i>Propostas
          </button>
          <button type="button" {...cur("regioes")} onClick={() => rolarPara("regioes")}>
            <i>03</i>Regiões
          </button>
          <button type="button" {...cur("esquerda")} onClick={() => rolarPara("esquerda")}>
            <i>04</i>Nova Esquerda
          </button>
          <button type="button" {...cur("mapa")} onClick={() => irPara("local")}>
            <i>05</i>Mapa
          </button>
          <button type="button" {...cur("atuar")} onClick={() => irPara("atuar")}>
            <i>06</i>Onde atuar
          </button>
          <Link href="/fontes">
            <i>07</i>Fontes
          </Link>
        </nav>
      </header>

      <Hero
        nacional={nacional.nacional}
        totalizacao={nacional.totalizacao}
        municipiosMapeados={nacional.municipiosMapeados}
        dias={dias}
        busca={<Busca resumo={resumo} onPick={(c) => { abrir(c, true); rolarPara("mapa"); }} />}
        onIr={irPara}
      />

      <MonitorPropostas />

      <ComparativoRegional regioes={regioes} />

      <EsquerdaRadical />

      <main className="grade" id="mapa">
        <section className="col-mapa" aria-label="Mapa">
          <div className="mapa-cab">
            <p className="eyebrow eyebrow-esc">05 · Mapa Municipal</p>
            <h2>Resultado por município</h2>
          </div>
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
            Cada polígono é um município; a área não é proporcional ao número de eleitores. Clique para abrir a localidade.
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
