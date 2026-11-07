"use client";

import { ReactNode, useState } from "react";
import { resumo } from "@/lib/metrics";
import { fInt, fPct, fPp } from "@/lib/format";
import { Agg } from "@/lib/types";

export type Destino = "local" | "propostas" | "regioes" | "esquerda";

interface Trilha {
  n: string;
  titulo: string;
  desc: string;
  destino: Destino;
}

const TRILHAS: Trilha[] = [
  {
    n: "01",
    titulo: "Monitor de propostas",
    desc: "Acompanhe os 12 compromissos centrais de campanha por eixo temático e estágio de execução.",
    destino: "propostas",
  },
  {
    n: "02",
    titulo: "Comparativo regional",
    desc: "Analise a virada entre o 1º e o 2º turno de 2026 nas 5 macrorregiões e nos 27 estados.",
    destino: "regioes",
  },
  {
    n: "03",
    titulo: "Vozes da esquerda",
    desc: "Conheça parlamentares, intelectuais e lideranças socialistas, comunistas e progressistas.",
    destino: "esquerda",
  },
  {
    n: "04",
    titulo: "Mapa por município",
    desc: "Consulte de forma direta os votos oficiais do TSE e os indicadores do IBGE em cada cidade.",
    destino: "local",
  },
];

export default function Hero({
  nacional1T,
  nacional2T,
  totalizacao1T,
  totalizacao2T,
  municipiosMapeados = 5571,
  busca,
  onIr,
}: {
  nacional1T: Agg;
  nacional2T: Agg;
  totalizacao1T: string;
  totalizacao2T: string;
  municipiosMapeados?: number;
  busca: ReactNode;
  onIr: (d: Destino) => void;
}) {
  const [turnoHero, setTurnoHero] = useState<"2t" | "1t">("2t");
  const atual = turnoHero === "2t" ? nacional2T : nacional1T;
  const r = resumo(atual);
  const r1 = resumo(nacional1T);
  const r2 = resumo(nacional2T);
  const saltoLula = r2.lula - r1.lula;
  const saltoPp = (r2.lulaPct ?? 0) - (r1.lulaPct ?? 0);

  return (
    <>
      <section className="hero" aria-labelledby="hero-titulo">
        <div className="hero-texto">
          <p className="eyebrow">Vitória da Democracia · Presidente Reeleito (2027–2030)</p>
          <h1 id="hero-titulo">
            Parabéns,
            <br />
            Presidente
            <br />
            <span className="hero-marca">Lula.</span>
          </h1>
          <p className="hero-sub">
            Com 64.256.232 votos (51,79%), o Brasil virou o jogo no 2º turno e reafirmou a soberania popular.
          </p>
          <p className="hero-apoio">
            Lula somou +{fInt(saltoLula)} novos votos no 2º turno ({fPp(saltoPp)}) e venceu com {fInt(Math.abs(r2.margem))} votos de frente. Agora o VoVira monitora cada proposta de campanha, compara os turnos por região e destaca a renovação da esquerda brasileira.
          </p>
          <div className="hero-acoes">
            <button type="button" className="cta" onClick={() => onIr("propostas")}>
              Monitorar propostas <span aria-hidden="true">↓</span>
            </button>
            <button type="button" className="cta cta-sec" onClick={() => onIr("regioes")}>
              Ver virada por região <span aria-hidden="true">→</span>
            </button>
            <span className="selo">51,79% · Eleito</span>
          </div>
          <div className="hero-busca">{busca}</div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="hero-contagem">
            <span className="hc-topo">Reeleito</span>
            <strong>13</strong>
            <span className="hc-unid">51,79%</span>
            <span className="hc-rodape">
              2º turno
              <small>25 · out</small>
            </span>
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

      <section className="parabens-faixa" aria-labelledby="parabens-titulo">
        <div className="parabens-conteudo">
          <div className="parabens-esq">
            <p className="eyebrow eyebrow-esc">01 · Homenagem & Compromisso</p>
            <h2 id="parabens-titulo">Uma virada histórica de +10,37 milhões de votos no 2º turno</h2>
            <p>
              Parabenizamos o presidente <strong>Luiz Inácio Lula da Silva</strong> e os <strong>{fInt(r2.lula)}</strong> eleitores e eleitoras que garantiram a vitória democrática em 25 de outubro de 2026. A queda de quase 3 milhões na abstenção e a mobilização popular reverteram o placar do 1º turno e abriram um novo ciclo de conquistas sociais.
            </p>
          </div>
          <ul className="parabens-pilares">
            <li>
              <strong>Democracia Soberana</strong>
              <span>Defesa intransigente do voto popular, das instituições públicas e da soberania nacional.</span>
            </li>
            <li>
              <strong>Justiça Social e Trabalho</strong>
              <span>Salário mínimo valorizado, isenção de IR até R$ 5 mil e combate sem trégua à fome.</span>
            </li>
            <li>
              <strong>Cobrança e Mobilização</strong>
              <span>Mais do que comemorar, acompanhar cada meta e impulsionar pautas populares avançadas.</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="numeros" aria-label="Resultado nacional oficial de 2026">
        <div className="numeros-cab">
          <div>
            <p className="eyebrow eyebrow-esc">Os números oficiais (TSE)</p>
            <p className="numeros-nota">
              {turnoHero === "2t"
                ? `2º turno 2026 (Eleição 6258), totalização oficial do TSE em ${totalizacao2T}.`
                : `1º turno 2026 (Eleição 6257), totalização oficial do TSE em ${totalizacao1T}.`}{" "}
              Percentuais calculados na hora a partir dos inteiros oficiais.
            </p>
          </div>
          <div className="seletor" role="group" aria-label="Selecionar turno nacional">
            <button type="button" aria-pressed={turnoHero === "2t"} onClick={() => setTurnoHero("2t")}>
              2º Turno 2026 (Resultado Final)
            </button>
            <button type="button" aria-pressed={turnoHero === "1t"} onClick={() => setTurnoHero("1t")}>
              1º Turno 2026
            </button>
          </div>
        </div>
        <ul className="numeros-grade">
          <li className="num-lula">
            <strong>{fPct(r.lulaPct)}</strong>
            <span>Lula {turnoHero === "2t" ? "· Eleito" : ""}</span>
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
            <small>{fInt(atual.abst)} pessoas</small>
          </li>
          <li className="num-dif">
            <strong>{fInt(Math.abs(r.margem))}</strong>
            <span>Diferença em votos</span>
            <small>{r.margem >= 0 ? `Lula à frente (${fPp(r.margemPp)})` : `1º turno (${fPp(r.margemPp)})`}</small>
          </li>
        </ul>
      </section>

      <section className="trilhas" aria-labelledby="trilhas-titulo">
        <p className="eyebrow eyebrow-esc">Painel Pós-Eleição</p>
        <h2 id="trilhas-titulo">Escolha uma trilha</h2>
        <ol className="trilhas-grade trilhas-grade-4">
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
