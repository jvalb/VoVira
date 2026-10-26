import { ReactNode } from "react";
import { resumo } from "@/lib/metrics";
import { fInt, fPct } from "@/lib/format";
import { Agg } from "@/lib/types";

export type Destino = "local" | "atuar" | "praticas" | "propostas" | "regioes" | "esquerda";

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
    desc: "Analise a evolução dos votos entre o 1º e o 2º turno nas 5 macrorregiões e nos 27 estados.",
    destino: "regioes",
  },
  {
    n: "03",
    titulo: "Nova esquerda radical",
    desc: "Conheça parlamentares, intelectuais e lideranças que impulsionam uma esquerda mais combativa.",
    destino: "esquerda",
  },
  {
    n: "04",
    titulo: "Mapa por município",
    desc: "Explore os votos oficiais do TSE nos 5.571 municípios e zonas eleitorais com indicadores do IBGE.",
    destino: "local",
  },
];

/**
 * Landing do VoVira — Edição Especial de Reeleição e Monitoramento Popular.
 * Mantém a estrutura visual editorial (background fotográfico, card vertical translúcido e placar de 3 itens)
 * celebrando a vitória democrática de Luiz Inácio Lula da Silva e abrindo as novas frentes de acompanhamento.
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
          <p className="eyebrow">Vitória da Democracia · Presidente Reeleito (2027–2030)</p>
          <h1 id="hero-titulo">
            Parabéns,
            <br />
            Presidente
            <br />
            <span className="hero-marca">Lula.</span>
          </h1>
          <p className="hero-sub">A soberania popular venceu. Agora começa o monitoramento popular e o avanço das conquistas.</p>
          <p className="hero-apoio">
            O povo brasileiro reafirmou nas urnas a defesa da democracia, dos direitos trabalhistas e da justiça social. O VoVira acompanha cada compromisso assumido, compara o voto nas regiões e apresenta as lideranças que renovam a esquerda brasileira.
          </p>
          <div className="hero-acoes">
            <button type="button" className="cta" onClick={() => onIr("propostas")}>
              Monitorar propostas <span aria-hidden="true">↓</span>
            </button>
            <button type="button" className="cta cta-sec" onClick={() => onIr("local")}>
              Abrir mapa <span aria-hidden="true">→</span>
            </button>
            <span className="selo">Lula reeleito</span>
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
            ) : (
              <>
                <span className="hc-topo">Reeleito</span>
                <strong>13</strong>
                <span className="hc-unid">Lula</span>
                <span className="hc-rodape">
                  Vitória
                  <small>2027–30</small>
                </span>
              </>
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

      <section className="parabens-faixa" aria-labelledby="parabens-titulo">
        <div className="parabens-conteudo">
          <div className="parabens-esq">
            <p className="eyebrow eyebrow-esc">01 · Homenagem & Compromisso</p>
            <h2 id="parabens-titulo">Uma vitória histórica construída voto a voto, cidade por cidade</h2>
            <p>
              Parabenizamos o presidente <strong>Luiz Inácio Lula da Silva</strong> e os milhões de brasileiras e brasileiros que defenderam nas urnas um projeto de país soberano, inclusivo e comprometido com quem vive do próprio trabalho. A reeleição consolida a reconstrução das políticas sociais e abre a tarefa histórica de aprofundar mudanças estruturais.
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

      <section className="numeros" aria-label="Resultado nacional do 1º turno">
        <div className="numeros-cab">
          <p className="eyebrow eyebrow-esc">Os números da base oficial</p>
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
            <small>{r.margem < 0 ? "1º turno · disputa revertida no 2º turno" : "Lula à frente"}</small>
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
