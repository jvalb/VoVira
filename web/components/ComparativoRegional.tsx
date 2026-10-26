"use client";

import { useState } from "react";
import { fInt, fPct, fPp } from "@/lib/format";
import { DadosTurno, RegiaoComparativo, RegiaoId } from "@/lib/regioes";
import { EKey } from "@/lib/types";

type ModoComparativo = "t1_t2_2022" | "t1_2022_2026";

function calcMetricas(d: DadosTurno) {
  const lulaPct = d.validos > 0 ? (100 * d.lula) / d.validos : 0;
  const opoPct = d.validos > 0 ? (100 * d.oponente) / d.validos : 0;
  const abstPct = d.aptos > 0 ? (100 * d.abst) / d.aptos : 0;
  const difVotos = d.lula - d.oponente;
  const difPp = lulaPct - opoPct;
  return { lulaPct, opoPct, abstPct, difVotos, difPp };
}

export default function ComparativoRegional({ regioes }: { regioes: RegiaoComparativo[] }) {
  const [modo, setModo] = useState<ModoComparativo>("t1_t2_2022");
  const [regiaoAberta, setRegiaoAberta] = useState<RegiaoId | "Todas">("Todas");

  const chaveBase: EKey = "2022t1";
  const chaveComp: EKey = modo === "t1_t2_2022" ? "2022t2" : "2026t1";
  const rotuloBase = modo === "t1_t2_2022" ? "1º Turno (2022)" : "1º Turno (2022)";
  const rotuloComp = modo === "t1_t2_2022" ? "2º Turno (2022)" : "1º Turno (2026)";

  return (
    <section className="secao-editorial secao-escura" id="regioes" aria-labelledby="regioes-titulo">
      <div className="secao-cab">
        <div>
          <p className="eyebrow">03 · Radiografia Territorial · TSE Oficial</p>
          <h2 id="regioes-titulo">Comparativo por região: 1º e 2º turno</h2>
          <p className="secao-sub secao-sub-esc">
            Veja como os votos válidos, a vantagem nominal e a taxa de abstenção se comportam entre o 1º e o 2º turno nas 5 macrorregiões do país e nas 27 Unidades da Federação, somados diretamente dos boletins de zona do TSE.
          </p>
        </div>

        <div className="modo-comparativo-box">
          <span className="filtro-rotulo filtro-rotulo-esc">Recorte eleitoral (TSE)</span>
          <div className="seletor seletor-esc">
            <button
              type="button"
              aria-pressed={modo === "t1_t2_2022"}
              onClick={() => setModo("t1_t2_2022")}
            >
              1º vs 2º Turno (Ciclo Completo TSE)
            </button>
            <button
              type="button"
              aria-pressed={modo === "t1_2022_2026"}
              onClick={() => setModo("t1_2022_2026")}
            >
              1º Turno 2022 vs 1º Turno 2026
            </button>
          </div>
        </div>
      </div>

      <div className="regioes-grade">
        {regioes.map((r, idx) => {
          const d1 = r.eleicoes[chaveBase];
          const d2 = r.eleicoes[chaveComp];
          const m1 = calcMetricas(d1);
          const m2 = calcMetricas(d2);
          const deltaLulaVotos = d2.lula - d1.lula;
          const deltaLulaPp = m2.lulaPct - m1.lulaPct;
          const deltaAbstPp = m2.abstPct - m1.abstPct;
          const lulaLidera2 = d2.lula >= d2.oponente;

          return (
            <article key={r.id} className={`regiao-card ${lulaLidera2 ? "regiao-lula" : "regiao-disputa"}`}>
              <header className="regiao-card-topo">
                <div>
                  <span className="regiao-idx">0{idx + 1} · {r.sigla}</span>
                  <h3>{r.nome}</h3>
                </div>
                <span className={`regiao-selo ${lulaLidera2 ? "selo-vantagem-lula" : "selo-vantagem-opo"}`}>
                  {lulaLidera2 ? `Lula +${fInt(Math.abs(m2.difVotos))}` : `Dif. ${fInt(Math.abs(m2.difVotos))}`}
                </span>
              </header>

              <p className="regiao-desc">{r.desc}</p>

              <div className="regiao-turnos">
                <div className="turno-bloco">
                  <div className="turno-cab">
                    <strong>{rotuloBase}</strong>
                    <small>{fInt(d1.validos)} votos válidos</small>
                  </div>
                  <div className="barra-dupla" aria-label={`${rotuloBase} em ${r.nome}`}>
                    <span className="bd-lula" style={{ width: `${m1.lulaPct}%` }}>
                      Lula {fPct(m1.lulaPct)}
                    </span>
                    <span className="bd-opo" style={{ width: `${m1.opoPct}%` }}>
                      22 {fPct(m1.opoPct)}
                    </span>
                  </div>
                  <div className="turno-numeros">
                    <span>Lula: <strong>{fInt(d1.lula)}</strong></span>
                    <span>Adversário: <strong>{fInt(d1.oponente)}</strong></span>
                  </div>
                </div>

                <div className="turno-bloco">
                  <div className="turno-cab">
                    <strong>{rotuloComp}</strong>
                    <small>{fInt(d2.validos)} votos válidos</small>
                  </div>
                  <div className="barra-dupla" aria-label={`${rotuloComp} em ${r.nome}`}>
                    <span className="bd-lula" style={{ width: `${m2.lulaPct}%` }}>
                      Lula {fPct(m2.lulaPct)}
                    </span>
                    <span className="bd-opo" style={{ width: `${m2.opoPct}%` }}>
                      22 {fPct(m2.opoPct)}
                    </span>
                  </div>
                  <div className="turno-numeros">
                    <span>Lula: <strong>{fInt(d2.lula)}</strong></span>
                    <span>Adversário: <strong>{fInt(d2.oponente)}</strong></span>
                  </div>
                </div>
              </div>

              <dl className="regiao-deltas">
                <div>
                  <dt>Salto Lula (votos)</dt>
                  <dd className={deltaLulaVotos >= 0 ? "delta-pos" : "delta-neg"}>
                    {deltaLulaVotos >= 0 ? `+${fInt(deltaLulaVotos)}` : fInt(deltaLulaVotos)}
                  </dd>
                </div>
                <div>
                  <dt>Variação Lula (%)</dt>
                  <dd className={deltaLulaPp >= 0 ? "delta-pos" : "delta-neg"}>
                    {fPp(deltaLulaPp)}
                  </dd>
                </div>
                <div>
                  <dt>Abstenção ({rotuloComp})</dt>
                  <dd>
                    {fPct(m2.abstPct)} <small>({fPp(deltaAbstPp)})</small>
                  </dd>
                </div>
              </dl>
            </article>
          );
        })}
      </div>

      <div className="uf-detalhe-box">
        <div className="uf-detalhe-cab">
          <div>
            <h3>Detalhamento por Estado (27 UFs · {fInt(5571)} municípios)</h3>
            <p className="nota" style={{ color: "#d6cfcd", margin: 0 }}>
              Filtre uma macrorregião para inspecionar a transferência de votos entre {rotuloBase} e {rotuloComp} estado por estado.
            </p>
          </div>
          <div className="seletor seletor-esc">
            <button type="button" aria-pressed={regiaoAberta === "Todas"} onClick={() => setRegiaoAberta("Todas")}>
              Todas as regiões (27 UFs)
            </button>
            {regioes.map((r) => (
              <button key={r.id} type="button" aria-pressed={regiaoAberta === r.id} onClick={() => setRegiaoAberta(r.id)}>
                {r.nome} ({r.ufs.length})
              </button>
            ))}
          </div>
        </div>

        <div className="tabela-fontes-wrap">
          <table className="tab tabela-fontes tabela-regioes">
            <thead>
              <tr>
                <th>UF / Estado</th>
                <th>Região</th>
                <th>Lula · {rotuloBase}</th>
                <th>Lula · {rotuloComp}</th>
                <th>Salto Lula (votos)</th>
                <th>Variação (p.p.)</th>
                <th>Saldo {rotuloComp} (Lula − 22)</th>
              </tr>
            </thead>
            <tbody>
              {regioes
                .filter((r) => regiaoAberta === "Todas" || r.id === regiaoAberta)
                .flatMap((r) =>
                  r.ufs.map((u) => {
                    const u1 = u.eleicoes[chaveBase];
                    const u2 = u.eleicoes[chaveComp];
                    const mu1 = calcMetricas(u1);
                    const mu2 = calcMetricas(u2);
                    const dVotos = u2.lula - u1.lula;
                    const dPp = mu2.lulaPct - mu1.lulaPct;
                    const saldo2 = u2.lula - u2.oponente;
                    return (
                      <tr key={u.uf}>
                        <th>
                          <span className="uf">{u.uf}</span> {u.nome}
                        </th>
                        <td>{r.nome}</td>
                        <td>
                          <strong>{fPct(mu1.lulaPct)}</strong> <small>({fInt(u1.lula)})</small>
                        </td>
                        <td>
                          <strong>{fPct(mu2.lulaPct)}</strong> <small>({fInt(u2.lula)})</small>
                        </td>
                        <td className={dVotos >= 0 ? "z-frente" : "z-atras"}>
                          {dVotos >= 0 ? `+${fInt(dVotos)}` : fInt(dVotos)}
                        </td>
                        <td className={dPp >= 0 ? "z-frente" : "z-atras"}>{fPp(dPp)}</td>
                        <td className={saldo2 >= 0 ? "z-frente" : "z-atras"}>
                          {saldo2 >= 0 ? `+${fInt(saldo2)}` : fInt(saldo2)} ({fPp(mu2.difPp)})
                        </td>
                      </tr>
                    );
                  })
                )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
