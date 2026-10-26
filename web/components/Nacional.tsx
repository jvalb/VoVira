import { resumo } from "@/lib/metrics";
import { fInt, fPct, fPp } from "@/lib/format";
import { Agg, Meta } from "@/lib/types";

export default function Nacional({
  meta,
}: {
  meta: {
    nacional: Agg;
    nacional2T: Agg;
    candidatos: Meta["candidatos"]["2026t1"];
    totalizacao: string;
    totalizacao2T: string;
  };
}) {
  const r1 = resumo(meta.nacional);
  const r2 = resumo(meta.nacional2T);
  const saltoVotos = r2.lula - r1.lula;
  const saltoPp = (r2.lulaPct ?? 0) - (r1.lulaPct ?? 0);

  const top1T = Object.entries(meta.nacional.v)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="painel-conteudo">
      <header>
        <h2>Brasil · Resultado Oficial</h2>
        <p className="nota">
          2º turno totalizado em {meta.totalizacao2T} ({fInt(meta.nacional2T.validos)} votos válidos). Clique em qualquer município no mapa ao lado para abrir os dados locais.
        </p>
      </header>

      <div className="placar" role="group" aria-label="Placar do 2º turno 2026 no Brasil">
        <div className="p-lula">
          <span>Lula (Eleito)</span>
          <strong>{fPct(r2.lulaPct)}</strong>
          <small>{fInt(r2.lula)} votos</small>
        </div>
        <div className="p-opo">
          <span>Flávio Bolsonaro</span>
          <strong>{fPct(r2.oponentePct)}</strong>
          <small>{fInt(r2.oponente)} votos</small>
        </div>
        <div className="p-abst">
          <span>Abstenção</span>
          <strong>{fPct(r2.abstPct)}</strong>
          <small>{fInt(meta.nacional2T.abst)} pessoas</small>
        </div>
      </div>

      <section className="card">
        <h3>Virada do 1º para o 2º turno</h3>
        <p className="destaque" style={{ margin: "0 0 .6rem" }}>
          Lula ampliou sua votação em <strong>+{fInt(saltoVotos)} votos</strong> ({fPp(saltoPp)}) no 2º turno e venceu com vantagem de <strong>+{fInt(Math.abs(r2.margem))} votos</strong>.
        </p>
        <table className="tab">
          <thead>
            <tr>
              <th>Indicador</th>
              <th>1º Turno</th>
              <th>2º Turno</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>Lula (13)</th>
              <td>{fPct(r1.lulaPct)}</td>
              <td><strong>{fPct(r2.lulaPct)}</strong></td>
            </tr>
            <tr>
              <th>Flávio Bolsonaro (22)</th>
              <td>{fPct(r1.oponentePct)}</td>
              <td>{fPct(r2.oponentePct)}</td>
            </tr>
            <tr>
              <th>Abstenção</th>
              <td>{fPct(r1.abstPct)}</td>
              <td>{fPct(r2.abstPct)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="card">
        <h3>1º Turno 2026 (Todos os candidatos)</h3>
        <ul className="barras" aria-label="Candidatos no 1º turno no Brasil">
          {top1T.map(([n, v]) => {
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
      </section>
    </div>
  );
}
