"use client";

import { resumo } from "@/lib/metrics";
import { fInt, fPct } from "@/lib/format";
import { Agg, Meta } from "@/lib/types";
import Simulador from "./Simulador";

export default function Nacional({ meta }: { meta: { nacional: Agg; candidatos: Meta["candidatos"]["2026t1"]; totalizacao: string } }) {
  const r = resumo(meta.nacional);
  const top = Object.entries(meta.nacional.v)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  return (
    <div className="painel-conteudo">
      <h2>Brasil — 1º turno 2026</h2>
      <p className="nota">Totalização do TSE em {meta.totalizacao}. Clique em um município no mapa para ver a localidade.</p>
      <div className="placar" role="group" aria-label="Resultado nacional">
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
          <small>{fInt(meta.nacional.abst)} pessoas</small>
        </div>
      </div>
      <p className="destaque">
        Diferença: <strong>{fInt(Math.abs(r.margem))} votos</strong> ({r.margem < 0 ? "oponente à frente" : "Lula à frente"}). Votos fora dos dois principais candidatos: <strong>{fInt(r.outros)}</strong>; brancos e nulos:{" "}
        <strong>{fInt(r.brancosNulos)}</strong>; abstenções: <strong>{fInt(meta.nacional.abst)}</strong>.
      </p>
      <ul className="barras" aria-label="Candidatos no Brasil">
        {top.map(([n, v]) => {
          const p = (100 * v) / meta.nacional.validos;
          return (
            <li key={n}>
              <span className="b-nome">
                {meta.candidatos[n]?.nome ?? n} <small>({meta.candidatos[n]?.partido})</small>
              </span>
              <span className="b-trilho">
                <span className={`b-preench ${n === "13" ? "lula" : n === "22" ? "opo" : ""}`} style={{ width: `${Math.max(p, 0.3)}%` }} />
              </span>
              <span className="b-val">{fPct(p)}</span>
            </li>
          );
        })}
      </ul>
      <Simulador agg={meta.nacional} nome="Brasil" />
    </div>
  );
}
