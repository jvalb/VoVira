"use client";

import { useEffect, useState } from "react";
import { resumo } from "@/lib/metrics";
import { fInt, fPct } from "@/lib/format";
import { Agg, ELECTION_LABEL, EKey, IndKey, Indicators } from "@/lib/types";

interface Detalhe {
  codigo: string;
  nome: string;
  uf: string;
  pop: number | null;
  indicadores: Indicators;
  referencias: { BR: Indicators; UF: Indicators | null };
  eleicoes: Partial<Record<EKey, Agg>>;
  uf2026t2?: Agg | null;
  zonas: Record<string, Partial<Record<EKey, Agg>>>;
}

const EKEYS: EKey[] = ["2022t1", "2022t2", "2026t1"];

const IND_LABEL: Record<IndKey, string> = {
  esgoto_adequado: "Esgoto ligado à rede",
  agua_rede: "Água da rede geral",
  lixo_coletado: "Lixo coletado",
  internet: "Internet em casa",
  alfabetizacao: "Alfabetização (15+ anos)",
};

export default function Painel({ codigo }: { codigo: string }) {
  const [d, setD] = useState<Detalhe | null>(null);
  const [erro, setErro] = useState<string | null>(null);

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

  if (erro) return <p className="erro">Não foi possível carregar a localidade: {erro}</p>;
  if (!d) return <p className="nota">Carregando…</p>;

  const a26 = d.eleicoes["2026t1"];
  const rUf2T = d.uf2026t2 ? resumo(d.uf2026t2) : null;
  const totalZonas = Object.keys(d.zonas).length;

  return (
    <div className="painel-conteudo">
      <header>
        <h2>
          {d.nome} <span className="uf">{d.uf}</span>
        </h2>
        <p className="nota">
          {d.pop != null ? `${fInt(d.pop)} hab. (Censo 2022) · ` : ""}
          {a26 ? `${fInt(a26.aptos)} eleitores aptos` : ""}
        </p>
        {a26 && <Placar agg={a26} />}
      </header>

      {rUf2T && (
        <p className="destaque" style={{ margin: 0 }}>
          <strong>2º Turno 2026 em {d.uf} (Estado):</strong> Lula <strong>{fPct(rUf2T.lulaPct)}</strong> ({fInt(rUf2T.lula)}) vs Flávio Bolsonaro <strong>{fPct(rUf2T.oponentePct)}</strong> ({fInt(rUf2T.oponente)}).
        </p>
      )}

      <section className="card" aria-labelledby="res-t">
        <h3 id="res-t">Histórico no município</h3>
        <table className="tab">
          <thead>
            <tr>
              <th>Indicador</th>
              {EKEYS.map((k) => (
                <th key={k}>{ELECTION_LABEL[k]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>Lula (% válidos)</th>
              {EKEYS.map((k) => (
                <td key={k}>{d.eleicoes[k] ? fPct(resumo(d.eleicoes[k]!).lulaPct) : "—"}</td>
              ))}
            </tr>
            <tr>
              <th>Adversário (% válidos)</th>
              {EKEYS.map((k) => (
                <td key={k}>{d.eleicoes[k] ? fPct(resumo(d.eleicoes[k]!).oponentePct) : "—"}</td>
              ))}
            </tr>
            <tr>
              <th>Abstenção</th>
              {EKEYS.map((k) => (
                <td key={k}>{d.eleicoes[k] ? fPct(resumo(d.eleicoes[k]!).abstPct) : "—"}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </section>

      <section className="card" aria-labelledby="terr-t">
        <h3 id="terr-t">Indicadores IBGE (Censo 2022)</h3>
        {d.pop == null && (
          <p className="nota">
            Município instalado após o Censo 2022; exibidas as referências de {d.uf} e Brasil.
          </p>
        )}
        <table className="tab">
          <thead>
            <tr>
              <th>Serviço / Acesso</th>
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

      {totalZonas > 1 && (
        <details className="card">
          <summary>
            <strong>Zonas eleitorais ({totalZonas})</strong>
          </summary>
          <table className="tab tab-zonas">
            <thead>
              <tr>
                <th>Zona</th>
                <th>Aptos</th>
                <th>Lula</th>
                <th>Adversário</th>
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
                  return (
                    <tr key={z}>
                      <th>{z}ª</th>
                      <td>{fInt(a.aptos)}</td>
                      <td className={r.margem >= 0 ? "z-frente" : undefined}>{fPct(r.lulaPct)}</td>
                      <td>{fPct(r.oponentePct)}</td>
                      <td>{fPct(r.abstPct)}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </details>
      )}
    </div>
  );
}

function Placar({ agg }: { agg: Agg }) {
  const r = resumo(agg);
  return (
    <div className="placar" role="group" aria-label="Placar eleitoral na localidade">
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
