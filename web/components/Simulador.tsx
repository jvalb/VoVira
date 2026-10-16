"use client";

import { useEffect, useState } from "react";
import { cenario, fracaoLulaDuelo, resumo } from "@/lib/metrics";
import { fInt, fPct, fSigned } from "@/lib/format";
import { Agg } from "@/lib/types";

function Slider({ id, label, value, onChange, hint }: { id: string; label: string; value: number; onChange: (n: number) => void; hint?: string }) {
  return (
    <div className="slider">
      <label htmlFor={id}>
        {label}: <strong>{Math.round(value)}%</strong>
      </label>
      <input id={id} type="range" min={0} max={100} step={1} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      {hint && <small>{hint}</small>}
    </div>
  );
}

/**
 * Simulador de cenário ILUSTRATIVO para o 2º turno. Parte dos votos do 1º turno de 2026 e aplica
 * hipóteses que o próprio usuário escolhe. Não é pesquisa nem previsão.
 */
export default function Simulador({ agg, nome }: { agg: Agg; nome: string }) {
  const duelo = Math.round(100 * fracaoLulaDuelo(agg));
  const [mob, setMob] = useState(10);
  const [mobLula, setMobLula] = useState(duelo);
  const [oLula, setOLula] = useState(0);
  const [oOpo, setOOpo] = useState(0);

  // ao trocar de localidade, reinicia as hipóteses
  useEffect(() => {
    setMob(10);
    setMobLula(duelo);
    setOLula(0);
    setOOpo(0);
  }, [agg, duelo]);

  const r = resumo(agg);
  const c = cenario(agg, { mobilizarPct: mob, mobilizadosLula: mobLula / 100, outrosLula: oLula / 100, outrosOponente: oOpo / 100 });
  const baseMargem = r.margem;
  const total = c.lula + c.oponente;

  return (
    <section className="card" aria-labelledby="sim-t">
      <h3 id="sim-t">Simulador de cenário — {nome}</h3>
      <p className="nota">
        Hipóteses suas, sobre os números do 1º turno de 2026. <strong>Não é pesquisa nem previsão.</strong>
      </p>
      <Slider id="s-mob" label="Abstencionistas que passam a votar" value={mob} onChange={setMob} hint={`${fInt(agg.abst)} abstenções no 1º turno`} />
      <Slider id="s-moblula" label="…dos quais votam em Lula" value={mobLula} onChange={setMobLula} hint={`Padrão: proporção Lula:oponente do 1º turno (${duelo}%)`} />
      <Slider id="s-olula" label="Eleitores de outros candidatos que votam em Lula" value={oLula} onChange={(n) => { setOLula(n); if (n + oOpo > 100) setOOpo(100 - n); }} hint={`${fInt(r.outros)} eleitores de outros candidatos`} />
      <Slider id="s-oopo" label="…que votam no oponente" value={oOpo} onChange={(n) => { setOOpo(n); if (n + oLula > 100) setOLula(100 - n); }} />
      <table className="tab" aria-label="Resultado do cenário">
        <thead>
          <tr>
            <th></th>
            <th>1º turno</th>
            <th>Cenário</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>Lula</th>
            <td>{fInt(r.lula)}</td>
            <td>{fInt(c.lula)} ({fSigned(c.ganhoLula)})</td>
          </tr>
          <tr>
            <th>Oponente</th>
            <td>{fInt(r.oponente)}</td>
            <td>{fInt(c.oponente)} ({fSigned(c.ganhoOponente)})</td>
          </tr>
          <tr>
            <th>Diferença (Lula − oponente)</th>
            <td>{fSigned(baseMargem)}</td>
            <td>
              <strong>{fSigned(c.margem)}</strong>
            </td>
          </tr>
          <tr>
            <th>Lula entre os dois</th>
            <td>{fPct((100 * r.lula) / Math.max(1, r.lula + r.oponente))}</td>
            <td>{fPct((100 * c.lula) / Math.max(1, total))}</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
