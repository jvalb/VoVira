"use client";

import { useEffect, useState } from "react";
import type { Insight } from "@/lib/insights";
import { pct, resumo, virada } from "@/lib/metrics";
import { fInt, fPct, fPp } from "@/lib/format";
import { Agg, ELECTION_LABEL, EKey, IndKey, Indicators } from "@/lib/types";
import { formatarRoteiroWhatsApp } from "@/lib/share";
import Simulador from "./Simulador";

interface Detalhe {
  codigo: string;
  nome: string;
  uf: string;
  pop: number | null;
  indicadores: Indicators;
  referencias: { BR: Indicators; UF: Indicators | null };
  eleicoes: Partial<Record<EKey, Agg>>;
  candidatos: Record<EKey, Record<string, { nome: string; partido: string }>>;
  zonas: Record<string, Partial<Record<EKey, Agg>>>;
  analise: { virada: { novosVotos: number; trocas: number }; ganhoMobilizacao10: number } | null;
  insights: Insight[];
}

const EKEYS: EKey[] = ["2022t1", "2022t2", "2026t1"];

const IND_LABEL: Record<IndKey, string> = {
  esgoto_adequado: "Esgoto ligado à rede",
  agua_rede: "Água da rede geral",
  lixo_coletado: "Lixo coletado",
  internet: "Internet em casa",
  alfabetizacao: "Alfabetização (15+ anos)",
};

const TIPO_LABEL: Record<Insight["tipo"], string> = {
  situacao: "Situação",
  mobilizar: "Mobilizar",
  persuadir: "Conversar",
  recuperar: "Recuperar",
  necessidade: "Necessidade local",
};

export default function Painel({ codigo }: { codigo: string }) {
  const [d, setD] = useState<Detalhe | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [eleicao, setEleicao] = useState<EKey>("2026t1");
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    let vivo = true;
    setD(null);
    setErro(null);
    fetch(`/api/municipio/${codigo}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j: Detalhe) => vivo && setD(j))
      .catch((e: Error) => vivo && setErro(e.message));
    return () => {
      vivo = false;
    };
  }, [codigo]);

  const copiarRoteiro = () => {
    if (!d) return;
    const url = typeof window !== "undefined" ? window.location.href : `https://vovira.app/?m=${d.codigo}`;
    const txt = formatarRoteiroWhatsApp(d, url);
    navigator.clipboard.writeText(txt).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    });
  };

  const compartilharWhatsApp = () => {
    if (!d) return;
    const url = typeof window !== "undefined" ? window.location.href : `https://vovira.app/?m=${d.codigo}`;
    const txt = formatarRoteiroWhatsApp(d, url);
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({
        title: `VoVira — ${d.nome}/${d.uf}`,
        text: txt,
      }).catch(() => {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(txt)}`, "_blank");
      });
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(txt)}`, "_blank");
    }
  };

  const imprimirFicha = () => {
    window.print();
  };

  if (erro) return <p className="erro">Não foi possível carregar a localidade: {erro}</p>;
  if (!d) return <p className="nota">Carregando…</p>;

  const a26 = d.eleicoes["2026t1"];
  const aSel = d.eleicoes[eleicao];
  const nomes = d.candidatos[eleicao];

  return (
    <div className="painel-conteudo">
      <header>
        <h2>
          {d.nome} <span className="uf">{d.uf}</span>
        </h2>
        <p className="nota">
          {d.pop != null ? `${fInt(d.pop)} habitantes (Censo 2022) · ` : ""}
          {a26 ? `${fInt(a26.aptos)} eleitores aptos` : ""}
        </p>
        {a26 && <Placar agg={a26} />}
        {d.analise && d.analise.virada.novosVotos > 0 && (
          <p className="destaque">
            Para Lula ficar à frente aqui: <strong>{fInt(d.analise.virada.novosVotos)} votos novos</strong> ou <strong>{fInt(d.analise.virada.trocas)} eleitores trocando de lado</strong>.
          </p>
        )}
        <div className="acoes-painel" role="toolbar" aria-label="Ações e compartilhamento">
          <button
            type="button"
            className={`btn-acao ${copiado ? "btn-sucesso" : ""}`}
            onClick={copiarRoteiro}
            title="Copiar roteiro de mobilização e dados formatados para WhatsApp/Telegram"
          >
            {copiado ? "✓ Roteiro Copiado!" : "📋 Copiar Roteiro"}
          </button>
          <button
            type="button"
            className="btn-acao btn-whats"
            onClick={compartilharWhatsApp}
            title="Compartilhar dados e roteiro no WhatsApp"
          >
            💬 WhatsApp
          </button>
          <button
            type="button"
            className="btn-acao"
            onClick={imprimirFicha}
            title="Imprimir ou salvar ficha municipal em PDF"
          >
            🖨️ Imprimir
          </button>
        </div>
      </header>

      <section className="card" aria-labelledby="alt-t">
        <h3 id="alt-t">Alternativas para conversar nesta localidade</h3>
        <p className="nota">Cada item parte de um dado oficial citado. As sugestões são pontos de partida para uma conversa respeitosa, não roteiros de convencimento.</p>
        {d.insights.map((i) => (
          <article key={i.id} className={`insight tipo-${i.tipo}`}>
            <span className="tag">{TIPO_LABEL[i.tipo]}</span>
            <h4>{i.titulo}</h4>
            <p>{i.fato}</p>
            <p className="conversa">
              <strong>Como abordar:</strong> {i.conversa}
            </p>
            <a className="fonte" href={i.fonte.url} target="_blank" rel="noreferrer noopener">
              Fonte: {i.fonte.nome}
            </a>
          </article>
        ))}
      </section>

      <section className="card" aria-labelledby="res-t">
        <h3 id="res-t">Resultados (Presidente)</h3>
        <table className="tab">
          <thead>
            <tr>
              <th></th>
              {EKEYS.map((k) => (
                <th key={k}>{ELECTION_LABEL[k]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas(d).map((l) => (
              <tr key={l.rotulo}>
                <th>{l.rotulo}</th>
                {l.vals.map((v, i) => (
                  <td key={i}>{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="seletor" role="group" aria-label="Eleição para ver candidatos">
          {EKEYS.filter((k) => d.eleicoes[k]).map((k) => (
            <button key={k} aria-pressed={eleicao === k} onClick={() => setEleicao(k)}>
              {ELECTION_LABEL[k]}
            </button>
          ))}
        </div>
        {aSel && (
          <ul className="barras" aria-label={`Candidatos — ${ELECTION_LABEL[eleicao]}`}>
            {Object.entries(aSel.v)
              .sort((a, b) => b[1] - a[1])
              .map(([n, votos]) => {
                const p = pct(votos, aSel.validos) ?? 0;
                return (
                  <li key={n}>
                    <span className="b-nome">
                      {nomes[n]?.nome ?? n} <small>({nomes[n]?.partido})</small>
                    </span>
                    <span className="b-trilho">
                      <span className={`b-preench ${n === "13" ? "lula" : n === "22" ? "opo" : ""}`} style={{ width: `${Math.max(p, 0.3)}%` }} />
                    </span>
                    <span className="b-val">
                      {fPct(p)} <small>({fInt(votos)})</small>
                    </span>
                  </li>
                );
              })}
          </ul>
        )}
      </section>

      <section className="card" aria-labelledby="terr-t">
        <h3 id="terr-t">Perfil do território (Censo 2022)</h3>
        {d.pop == null && (
          <p className="nota">
            Município instalado após a realização do Censo Demográfico 2022; sem série própria do IBGE nesta edição (exibidas as referências de {d.uf} e Brasil).
          </p>
        )}
        <table className="tab">
          <thead>
            <tr>
              <th></th>
              <th>{d.nome}</th>
              <th>{d.uf}</th>
              <th>Brasil</th>
            </tr>
          </thead>
          <tbody>
            {(Object.keys(IND_LABEL) as IndKey[]).map((k) => (
              <tr key={k}>
                <th>{IND_LABEL[k]}</th>
                <td>{fPct(d.indicadores[k])}</td>
                <td>{fPct(d.referencias.UF?.[k])}</td>
                <td>{fPct(d.referencias.BR[k])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {a26 && <Simulador agg={a26} nome={d.nome} />}

      <details className="card">
        <summary>
          <strong>Zonas eleitorais</strong> ({Object.keys(d.zonas).length}) — 1º turno 2026
        </summary>
        <p className="nota">
          Votação por zona eleitoral do município. A coluna <em>Virada / Vantagem</em> indica a diferença direta necessária para Lula liderar em cada zona.
        </p>
        <table className="tab tab-zonas">
          <thead>
            <tr>
              <th>Zona</th>
              <th>Aptos</th>
              <th>Lula</th>
              <th>Oponente</th>
              <th>Virada / Vantagem</th>
              <th>Abst.</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(d.zonas)
              .sort((a, b) => Number(a[0]) - Number(b[0]))
              .map(([z, e]) => {
                const a = e["2026t1"];
                if (!a) return null;
                const r = resumo(a);
                const v = virada(r.margem);
                const viradaDesc =
                  r.margem < 0
                    ? `+${fInt(v.novosVotos)} novos (${fInt(v.trocas)} trocas)`
                    : r.margem === 0
                    ? "Empate (+1 novo)"
                    : `Lula +${fInt(r.margem)}`;
                return (
                  <tr key={z}>
                    <th>{z}ª</th>
                    <td>{fInt(a.aptos)}</td>
                    <td>{fPct(r.lulaPct)}</td>
                    <td>{fPct(r.oponentePct)}</td>
                    <td className={r.margem < 0 ? "z-atras" : "z-frente"}>{viradaDesc}</td>
                    <td>{fPct(r.abstPct)}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </details>
    </div>
  );
}

function Placar({ agg }: { agg: Agg }) {
  const r = resumo(agg);
  return (
    <div className="placar" role="group" aria-label="Resultado do 1º turno 2026 na localidade">
      <div className="p-lula">
        <span>Lula</span>
        <strong>{fPct(r.lulaPct)}</strong>
        <small>{fInt(r.lula)} votos</small>
      </div>
      <div className="p-opo">
        <span>Flávio Bolsonaro</span>
        <strong>{fPct(r.oponentePct)}</strong>
        <small>{fInt(r.oponente)} votos</small>
      </div>
      <div className="p-abst">
        <span>Abstenção</span>
        <strong>{fPct(r.abstPct)}</strong>
        <small>{fInt(agg.abst)} pessoas</small>
      </div>
    </div>
  );
}

function linhas(d: Detalhe) {
  const get = (f: (a: Agg) => string) => EKEYS.map((k) => (d.eleicoes[k] ? f(d.eleicoes[k]!) : "—"));
  const lulaPct = (k: EKey) => (d.eleicoes[k] ? resumo(d.eleicoes[k]!).lulaPct : null);
  return [
    { rotulo: "Lula (% válidos)", vals: get((a) => fPct(resumo(a).lulaPct)) },
    { rotulo: "Oponente (% válidos)", vals: get((a) => fPct(resumo(a).oponentePct)) },
    { rotulo: "Abstenção", vals: get((a) => fPct(resumo(a).abstPct)) },
    { rotulo: "Brancos + nulos (% comparec.)", vals: get((a) => fPct(pct(a.brancos + a.nulos, a.comp))) },
    {
      rotulo: "Lula: variação vs 1º t. 2022",
      vals: EKEYS.map((k) => {
        const base = lulaPct("2022t1");
        const v = lulaPct(k);
        return k === "2022t1" || base == null || v == null ? "—" : fPp(v - base);
      }),
    },
  ];
}
