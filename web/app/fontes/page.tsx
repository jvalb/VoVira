import Link from "next/link";
import { store } from "@/lib/data";
import { fInt } from "@/lib/format";

export const metadata = { title: "Fontes e metodologia — VoVira" };

const PRINCIPIOS = [
  {
    n: "01",
    titulo: "Coleta direta dos órgãos oficiais",
    texto:
      "Os arquivos originais do TSE e do IBGE são baixados diretamente dos servidores oficiais e guardados exatamente como recebidos. Abaixo estão URL, data de coleta e hash SHA-256 de cada arquivo para que qualquer pessoa possa baixar e conferir.",
  },
  {
    n: "02",
    titulo: "Somas exatas de inteiros",
    texto:
      "Todos os números eleitorais exibidos (votos, aptos, comparecimento, abstenções, brancos e nulos) são somas de inteiros do TSE. Nada é estimado, suavizado ou arredondado antes do cálculo.",
  },
  {
    n: "03",
    titulo: "Validação cruzada obrigatória",
    texto:
      "O processamento falha se alguma checagem não passar: soma dos votos por candidato igual aos votos nominais válidos; válidos + brancos + nulos igual ao comparecimento; correspondência unívoca entre códigos TSE e IBGE.",
  },
  {
    n: "04",
    titulo: "Reprodução integral dos totais",
    texto:
      "Os totais nacionais e estaduais reproduzem exatamente os resultados oficiais divulgados pelo TSE (2026, 2º turno: Lula 64.256.232 votos vs 59.826.041 votos; 1º turno: 53.879.538 votos; 2022, 2º turno: 60.345.999 votos).",
  },
];

const LIMITES = [
  {
    n: "01",
    titulo: "2º Turno 2026 (Eleição 6258) e granulosidade",
    texto:
      "Os resultados oficiais do 2º turno de 2026 (25/10/2026) são extraídos diretamente da API oficial do TSE (resultados.tse.jus.br, eleição 6258) para o Brasil, Exterior e todas as 27 Unidades da Federação (e 5 macrorregiões). No mapa municipal por zona, os polígonos exibem as séries municipais consolidadas de 2022 (1º e 2º turnos) e 2026 (1º turno).",
  },
  {
    n: "02",
    titulo: "Tendência histórica não é causa",
    texto: "Comparar eleições diferentes mostra tendência territorial, não relação de causa e efeito, já que o quadro de candidatos e o contexto mudam.",
  },
  {
    n: "03",
    titulo: "Geometria por município, zonas em tabela",
    texto: "O TSE publica resultados por zona e seção, mas não existem polígonos oficiais de zonas eleitorais; por isso o mapa exibe municípios e as zonas aparecem detalhadas em tabela.",
  },
  {
    n: "04",
    titulo: "Indicador socioeconômico não define voto",
    texto: "Os indicadores do Censo 2022 (IBGE) descrevem condições reais de infraestrutura e vida da população local; eles contextualizam prioridades públicas, mas não determinam o voto individual.",
  },
  {
    n: "05",
    titulo: "Município recém-instalado (MT)",
    texto: "Boa Esperança do Norte (MT) é município novo: ainda não possui polígono separado na malha vigente do IBGE nem série histórica própria de 2022 ou Censo 2022.",
  },
  {
    n: "06",
    titulo: "Votos no exterior (ZZ)",
    texto: "Os votos registrados em seções no exterior entram integralmente nos totais nacionais do TSE, mas não pertencem a nenhum município brasileiro no mapa.",
  },
];

export default function Fontes() {
  const { meta } = store();
  const arquivos = Object.entries(meta.fontes);
  const formulas = Object.entries(meta.formulas);

  return (
    <div className="app fontes-app">
      <a className="pular" href="#conteudo-fontes">
        Pular para o conteúdo
      </a>

      <header className="topo">
        <Link href="/" className="logo" aria-label="VoVira, voltar ao início">
          Vo<span>Vira</span>
        </Link>
        <nav className="menu" aria-label="Principal">
          <Link href="/">
            <i>01</i>Início
          </Link>
          <Link href="/#propostas">
            <i>02</i>Propostas
          </Link>
          <Link href="/#regioes">
            <i>03</i>Regiões
          </Link>
          <Link href="/#esquerda">
            <i>04</i>Vozes da Esquerda
          </Link>
          <Link href="/#mapa">
            <i>05</i>Mapa
          </Link>
          <Link href="/fontes" className="ativo" aria-current="page">
            <i>06</i>Fontes
          </Link>
        </nav>
      </header>

      <main id="conteudo-fontes">
        <section className="fontes-hero" aria-labelledby="fontes-titulo">
          <div className="fontes-hero-esq">
            <p className="eyebrow">06 · Transparência e verificação pública</p>
            <h1 id="fontes-titulo">
              Fontes e
              <br />
              <span className="hero-marca">metodologia.</span>
            </h1>
            <p className="hero-sub">Cada número tem documento de origem, fórmula aberta e hash de integridade.</p>
            <p className="hero-apoio">
              Nenhum dado bruto do TSE ou do IBGE é alterado. Resultado desta versão:{" "}
              <strong>{fInt(Number(meta.validacoes.municipios_tse_mapeados))} municípios mapeados, 2º turno 2026 integrado e todas as validações aprovadas</strong>.
            </p>
            <div className="hero-acoes">
              <Link href="/#mapa" className="cta">
                ← Voltar ao mapa
              </Link>
              <span className="selo">SHA-256 verificado</span>
            </div>
          </div>

          <dl className="placar-fontes" aria-label="Resumo da auditoria de dados">
            <div>
              <dt>Municípios mapeados</dt>
              <dd>{fInt(Number(meta.validacoes.municipios_tse_mapeados))}</dd>
            </div>
            <div>
              <dt>Bases oficiais</dt>
              <dd>{arquivos.length} arquivos</dd>
            </div>
            <div>
              <dt>Integridade</dt>
              <dd>SHA-256</dd>
            </div>
          </dl>
        </section>

        <section className="fontes-secao fontes-clara" aria-labelledby="principios-t">
          <p className="eyebrow eyebrow-esc">01 · Integridade dos dados</p>
          <h2 id="principios-t">Dados oficiais, sem alteração</h2>
          <ol className="fontes-grade-4">
            {PRINCIPIOS.map((p) => (
              <li key={p.n} className="fontes-card">
                <span className="fc-num">{p.n}</span>
                <h3>{p.titulo}</h3>
                <p>{p.texto}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="fontes-secao fontes-escura" aria-labelledby="formulas-t">
          <p className="eyebrow">02 · Reprodutibilidade matemática</p>
          <h2 id="formulas-t">Fórmulas calculadas na hora</h2>
          <p className="fontes-sub-esc">
            Quando o VoVira calcula um percentual, margem ou estimativa de mobilização, a conta é feita em tempo de execução a partir dos inteiros originais:
          </p>
          <ul className="formulas-grade">
            {formulas.map(([k, v], idx) => (
              <li key={k} className="formula-card">
                <div className="formula-topo">
                  <span className="formula-idx">{String(idx + 1).padStart(2, "0")}</span>
                  <code>{k}</code>
                </div>
                <p>{v}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="fontes-secao fontes-clara" aria-labelledby="limites-t">
          <p className="eyebrow eyebrow-esc">03 · Transparência metodológica</p>
          <h2 id="limites-t">Limites que você deve conhecer</h2>
          <ol className="limites-grade">
            {LIMITES.map((l) => (
              <li key={l.n} className="limite-card">
                <span className="lc-num">{l.n}</span>
                <div>
                  <h3>{l.titulo}</h3>
                  <p>{l.texto}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="fontes-secao fontes-clara fontes-arquivos" aria-labelledby="arquivos-t">
          <div className="numeros-cab">
            <div>
              <p className="eyebrow eyebrow-esc">04 · Auditoria pública (SHA-256)</p>
              <h2 id="arquivos-t">Arquivos de origem</h2>
            </div>
            <p className="numeros-nota">
              Totalização TSE: 2º turno 2026 em <strong>{meta.tse_arquivos["2026t2"]?.ultima_totalizacao}</strong> · 1º turno 2026 em{" "}
              <strong>{meta.tse_arquivos["2026t1"].ultima_totalizacao}</strong>.
            </p>
          </div>

          <div className="tabela-fontes-wrap">
            <table className="tab tabela-fontes">
              <thead>
                <tr>
                  <th>Arquivo</th>
                  <th>URL oficial de origem</th>
                  <th>Coletado (UTC)</th>
                  <th>Hash SHA-256</th>
                </tr>
              </thead>
              <tbody>
                {arquivos.map(([nome, f]) => (
                  <tr key={nome}>
                    <th>{nome}</th>
                    <td>
                      <a href={f.url} target="_blank" rel="noreferrer noopener">
                        {f.url}
                      </a>
                    </td>
                    <td className="tf-data">{f.coletado_utc}</td>
                    <td>
                      <code className="tf-hash">{f.sha256}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <footer className="rodape">
        Dados: TSE (Dados Abertos + API Oficial Eleição 6258) e IBGE, sem alteração; percentuais calculados na hora.{" "}
        <Link href="/#mapa">Voltar ao mapa interativo</Link>.
      </footer>
    </div>
  );
}
