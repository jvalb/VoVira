import { ReactNode } from "react";
import { resumo } from "@/lib/metrics";
import { fInt, fPct } from "@/lib/format";
import { Agg } from "@/lib/types";

export type Destino = "local" | "atuar" | "praticas";

interface Trilha {
  n: string;
  titulo: string;
  desc: string;
  destino: Destino;
}

const TRILHAS: Trilha[] = [
  { n: "01", titulo: "Mapa por município", desc: "Veja o resultado oficial do TSE por cidade e zona, com o contexto do IBGE.", destino: "local" },
  { n: "02", titulo: "Onde atuar", desc: "Cidades onde mobilizar abstenção e conversar rende mais votos.", destino: "atuar" },
  { n: "03", titulo: "Boas práticas", desc: "Como conversar com respeito, sem desinformação e dentro da lei.", destino: "praticas" },
];

/**
 * Landing do VoVira. Estrutura: um título (nível 1), uma ação dominante (CTA único),
 * números oficiais logo abaixo e três trilhas numeradas de entrada (divulgação progressiva).
 */
export default function Hero({
  nacional,
  totalizacao,
  municipiosMapeados = 5571,
  dias,
  busca,
  onIr,
}: {
  nacional: Agg;
  totalizacao: string;
  municipiosMapeados?: number;
  dias: number | null;
  busca: ReactNode;
  onIr: (d: Destino) => void;
}) {
  const r = resumo(nacional);
  return (
    <>
      <section className="hero" aria-labelledby="hero-titulo">
        <div className="hero-texto">
          <p className="eyebrow">Segundo turno · eleição presidencial 2026</p>
          <h1 id="hero-titulo">
            Cada voto
            <br />
            conta.
            <br />
            <span className="hero-marca">Vire o jogo.</span>
          </h1>
          <p className="hero-sub">Onde está cada voto, cidade por cidade.</p>
          <p className="hero-apoio">Dados oficiais do TSE e do IBGE, sem alteração, para conversar e mobilizar com informação.</p>
          <div className="hero-acoes">
            <button type="button" className="cta" onClick={() => onIr("local")}>
              Escolha seu município <span aria-hidden="true">↓</span>
            </button>
            <span className="selo">tudo com fonte</span>
          </div>
          <div className="hero-busca">{busca}</div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="hero-contagem">
            {dias != null && dias > 0 ? (
              <>
                <span className="hc-topo">Faltam</span>
                <strong>{dias}</strong>
                <span className="hc-unid">{dias === 1 ? "Dia" : "Dias"}</span>
                <span className="hc-rodape">
                  2º turno
                  <small>25 · out</small>
                </span>
              </>
            ) : dias === 0 ? (
              <>
                <span className="hc-topo">Votação</span>
                <strong className="hoje">Hoje</strong>
                <span className="hc-rodape">
                  2º turno
                  <small>25 · out</small>
                </span>
              </>
            ) : (
              <span className="hc-rodape">2º turno realizado</span>
            )}
          </div>
          <dl className="placar-hero">
            <div>
              <dt>Turno</dt>
              <dd>
                2<sup>º</sup>
              </dd>
            </div>
            <div>
              <dt>Municípios</dt>
              <dd>{fInt(municipiosMapeados)}</dd>
            </div>
            <div>
              <dt>Ano</dt>
              <dd>2026</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="numeros" aria-label="Resultado nacional do 1º turno">
        <div className="numeros-cab">
          <p className="eyebrow eyebrow-esc">Os números</p>
          <p className="numeros-nota">1º turno 2026, totalização do TSE em {totalizacao}. Percentuais calculados na hora a partir dos votos oficiais.</p>
        </div>
        <ul className="numeros-grade">
          <li className="num-lula">
            <strong>{fPct(r.lulaPct)}</strong>
            <span>Lula</span>
            <small>{fInt(r.lula)} votos</small>
          </li>
          <li className="num-flavio">
            <strong>{fPct(r.oponentePct)}</strong>
            <span>Flávio Bolsonaro</span>
            <small>{fInt(r.oponente)} votos</small>
          </li>
          <li className="num-abst">
            <strong>{fPct(r.abstPct)}</strong>
            <span>Abstenção</span>
            <small>{fInt(nacional.abst)} pessoas</small>
          </li>
          <li className="num-dif">
            <strong>{fInt(Math.abs(r.margem))}</strong>
            <span>Diferença em votos</span>
            <small>{r.margem < 0 ? "oponente à frente" : "Lula à frente"}</small>
          </li>
        </ul>
      </section>

      <section className="trilhas" aria-labelledby="trilhas-titulo">
        <p className="eyebrow eyebrow-esc">Por onde começar</p>
        <h2 id="trilhas-titulo">Escolha uma trilha</h2>
        <ol className="trilhas-grade">
          {TRILHAS.map((t) => (
            <li key={t.n}>
              <button type="button" onClick={() => onIr(t.destino)}>
                <span className="t-num">{t.n}</span>
                <span className="t-tit">{t.titulo}</span>
                <span className="t-desc">{t.desc}</span>
                <span className="t-ver">
                  Abrir <span aria-hidden="true">→</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
