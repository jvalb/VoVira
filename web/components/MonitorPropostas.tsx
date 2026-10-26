"use client";

import { useEffect, useState } from "react";

export type EixoProposta =
  | "Economia e Trabalho"
  | "Social e Saúde"
  | "Educação e Ciência"
  | "Clima e Amazônia"
  | "Democracia e Soberania";

export type StatusProposta = "cumprida" | "andamento" | "nao_iniciada";

export interface Proposta {
  id: string;
  num: string;
  titulo: string;
  eixo: EixoProposta;
  statusPadrao: StatusProposta;
  progresso: number;
  promessa: string;
  metaIndicador: string;
  fonteAcompanhamento: string;
}

const EIXOS: Array<"Todos" | EixoProposta> = [
  "Todos",
  "Economia e Trabalho",
  "Social e Saúde",
  "Educação e Ciência",
  "Clima e Amazônia",
  "Democracia e Soberania",
];

const STATUS_LABEL: Record<StatusProposta, string> = {
  cumprida: "Cumprida / Consolidada",
  andamento: "Em andamento",
  nao_iniciada: "Em articulação",
};

const PROPOSTAS: Proposta[] = [
  {
    id: "ir-5mil",
    num: "01",
    titulo: "Isenção de Imposto de Renda até R$ 5 mil e taxação de super-ricos",
    eixo: "Economia e Trabalho",
    statusPadrao: "cumprida",
    progresso: 100,
    promessa: "Isentar trabalhadoras e trabalhadores que ganham até R$ 5.000 mensais e compensar com alíquota mínima sobre rendas milionárias, dividendos e offshores.",
    metaIndicador: "Faixa de isenção efetiva até R$ 5.000/mês + tributação de fundos exclusivos/offshores sancionada.",
    fonteAcompanhamento: "Ministério da Fazenda / Receita Federal",
  },
  {
    id: "salario-minimo",
    num: "02",
    titulo: "Política permanente de valorização real do Salário Mínimo",
    eixo: "Economia e Trabalho",
    statusPadrao: "cumprida",
    progresso: 100,
    promessa: "Garantir em lei o reajuste anual do salário mínimo acima da inflação (INPC + crescimento do PIB de dois anos antes), recuperando o poder de compra popular.",
    metaIndicador: "Lei nº 14.663 sancionada e aplicada nos orçamentos anuais consecutivos.",
    fonteAcompanhamento: "Ministério do Trabalho e Emprego / DIEESE",
  },
  {
    id: "escala-6x1",
    num: "03",
    titulo: "Redução da jornada de trabalho e fim da escala 6x1 sem corte salarial",
    eixo: "Economia e Trabalho",
    statusPadrao: "andamento",
    progresso: 45,
    promessa: "Avançar na redução da jornada semanal máxima e na superação da escala 6x1, garantindo tempo de vida, descanso e qualificação para a classe trabalhadora.",
    metaIndicador: "Tramitação da PEC no Congresso Nacional e mesa nacional de negociação tripartite.",
    fonteAcompanhamento: "Câmara dos Deputados / Ministério do Trabalho",
  },
  {
    id: "mapa-da-fome",
    num: "04",
    titulo: "Brasil fora do Mapa da Fome e Bolsa Família com adicional por criança",
    eixo: "Social e Saúde",
    statusPadrao: "cumprida",
    progresso: 95,
    promessa: "Retirar novamente o Brasil do Mapa da Fome da ONU, mantendo o piso de R$ 600 no Bolsa Família mais R$ 150 por criança de até 6 anos e R$ 50 para gestantes e jovens.",
    metaIndicador: "Queda de 85% na insegurança alimentar grave (IBGE/PNAD e relatório SOFI/FAO).",
    fonteAcompanhamento: "MDS / IBGE / FAO-ONU",
  },
  {
    id: "especialistas-sus",
    num: "05",
    titulo: "Mais Acesso a Especialistas no SUS e expansão do Mais Médicos",
    eixo: "Social e Saúde",
    statusPadrao: "andamento",
    progresso: 70,
    promessa: "Zerar filas históricas de exames, cirurgias eletivas e consultas especializadas no SUS com pacotes integrados (OCI) e dobrar a cobertura do Mais Médicos nas periferias.",
    metaIndicador: "Mais de 28 mil médicos em atuação e rede nacional de exames integrados em implantação.",
    fonteAcompanhamento: "Ministério da Saúde / DataSUS",
  },
  {
    id: "minha-casa",
    num: "06",
    titulo: "Minha Casa, Minha Vida: 2 milhões de novas moradias contratadas",
    eixo: "Social e Saúde",
    statusPadrao: "andamento",
    progresso: 80,
    promessa: "Retomar a Faixa 1 para famílias de baixa renda, incluir isenção de prestações para beneficiários do Bolsa Família/BPC e atingir 2 milhões de moradias contratadas.",
    metaIndicador: "Mais de 1,6 milhão de unidades contratadas com foco na Faixa 1 e requalificação urbana.",
    fonteAcompanhamento: "Ministério das Cidades / Caixa",
  },
  {
    id: "pe-de-meia",
    num: "07",
    titulo: "Programa Pé-de-Meia universalizado e 100 novos Institutos Federais",
    eixo: "Educação e Ciência",
    statusPadrao: "cumprida",
    progresso: 90,
    promessa: "Combater a evasão no ensino médio público com poupança estudantil mensal e expandir a rede federal de educação profissional e tecnológica em todas as regiões.",
    metaIndicador: "Quase 4 milhões de estudantes no Pé-de-Meia e obras dos 100 novos campi de IFs contratadas.",
    fonteAcompanhamento: "Ministério da Educação (MEC) / FNDE",
  },
  {
    id: "reajuste-ciencia",
    num: "08",
    titulo: "Recomposição integral do FNDCT, bolsas de pesquisa e universidades",
    eixo: "Educação e Ciência",
    statusPadrao: "cumprida",
    progresso: 100,
    promessa: "Reajustar bolsas da CAPES e CNPq após anos de congelamento, desbloquear 100% do Fundo Nacional de Desenvolvimento Científico e Tecnológico e retomar obras em universidades.",
    metaIndicador: "Bolsas reajustadas em até 75% e FNDCT operando em sua totalidade sem contingenciamento.",
    fonteAcompanhamento: "MCTI / CAPES / CNPq",
  },
  {
    id: "desmatamento-zero",
    num: "09",
    titulo: "Rumo ao Desmatamento Zero na Amazônia até 2030 e retomada das demarcações",
    eixo: "Clima e Amazônia",
    statusPadrao: "andamento",
    progresso: 75,
    promessa: "Reduzir drasticamente o desmatamento ilegal na Amazônia e no Cerrado, fortalecer o IBAMA/ICMBio, reativar o Fundo Amazônia e homologar Terras Indígenas.",
    metaIndicador: "Queda acumulada superior a 45% no desmatamento da Amazônia (PRODES/INPE) e novas TIs homologadas.",
    fonteAcompanhamento: "MMA / INPE / Ministério dos Povos Indígenas",
  },
  {
    id: "transicao-ecologica",
    num: "10",
    titulo: "Plano de Transformação Ecológica e Neoindustrialização Verde",
    eixo: "Clima e Amazônia",
    statusPadrao: "andamento",
    progresso: 60,
    promessa: "Impulsionar o programa Nova Indústria Brasil (NIB) com mercado regulado de carbono, hidrogênio verde, mobilidade elétrica pública e bioeconomia amazônica.",
    metaIndicador: "Marco do mercado de carbono aprovado e linhas de crédito do BNDES Mais Inovação em operação.",
    fonteAcompanhamento: "MDIC / BNDES / Ministério da Fazenda",
  },
  {
    id: "cesta-basica-zero",
    num: "11",
    titulo: "Reforma Tributária com Cesta Básica Nacional isenta (alíquota zero) e Cashback",
    eixo: "Democracia e Soberania",
    statusPadrao: "cumprida",
    progresso: 95,
    promessa: "Regulamentar o IVA dual com imposto zero para os alimentos da Cesta Básica Nacional e devolução de tributos (cashback) na conta de luz, gás e água para famílias de baixa renda.",
    metaIndicador: "Emenda Constitucional 132 promulgada e leis complementares de cashback e cesta básica aprovadas.",
    fonteAcompanhamento: "Congresso Nacional / Ministério da Fazenda",
  },
  {
    id: "soberania-digital",
    num: "12",
    titulo: "Regulação democrática das plataformas digitais, IA soberana e direitos de entregadores",
    eixo: "Democracia e Soberania",
    statusPadrao: "nao_iniciada",
    progresso: 30,
    promessa: "Responsabilizar grandes plataformas digitais contra ataques à democracia, desenvolver infraestrutura pública de IA (Plano Brasileiro de IA) e garantir direitos previdenciários a trabalhadores de aplicativos.",
    metaIndicador: "PBIA lançado; regulação das big techs e marco dos trabalhadores por plataforma em disputa legislativa.",
    fonteAcompanhamento: "Secom / MCTI / Câmara dos Deputados",
  },
];

const STORAGE_KEY = "vovira_status_propostas_v1";

export default function MonitorPropostas() {
  const [eixoAtivo, setEixoAtivo] = useState<"Todos" | EixoProposta>("Todos");
  const [statusFiltro, setStatusFiltro] = useState<"Todos" | StatusProposta>("Todos");
  const [customStatus, setCustomStatus] = useState<Record<string, StatusProposta>>({});

  useEffect(() => {
    try {
      const salvo = window.localStorage.getItem(STORAGE_KEY);
      if (salvo) setCustomStatus(JSON.parse(salvo));
    } catch {
      // ignora erro de localStorage
    }
  }, []);

  const statusDe = (p: Proposta): StatusProposta => customStatus[p.id] ?? p.statusPadrao;

  const alternarStatus = (p: Proposta) => {
    const ordem: StatusProposta[] = ["nao_iniciada", "andamento", "cumprida"];
    const atual = statusDe(p);
    const prox = ordem[(ordem.indexOf(atual) + 1) % ordem.length];
    const novo = { ...customStatus, [p.id]: prox };
    setCustomStatus(novo);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(novo));
    } catch {
      // ignora erro de localStorage
    }
  };

  const restaurarPadrao = () => {
    setCustomStatus({});
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignora
    }
  };

  const totalCumpridas = PROPOSTAS.filter((p) => statusDe(p) === "cumprida").length;
  const totalAndamento = PROPOSTAS.filter((p) => statusDe(p) === "andamento").length;
  const totalArticulacao = PROPOSTAS.filter((p) => statusDe(p) === "nao_iniciada").length;
  const mediaProgresso = Math.round(PROPOSTAS.reduce((acc, p) => acc + (statusDe(p) === "cumprida" ? 100 : statusDe(p) === "andamento" ? p.progresso : Math.min(p.progresso, 30)), 0) / PROPOSTAS.length);

  const visiveis = PROPOSTAS.filter((p) => {
    if (eixoAtivo !== "Todos" && p.eixo !== eixoAtivo) return false;
    if (statusFiltro !== "Todos" && statusDe(p) !== statusFiltro) return false;
    return true;
  });

  return (
    <section className="secao-editorial secao-clara" id="propostas" aria-labelledby="propostas-titulo">
      <div className="secao-cab">
        <div>
          <p className="eyebrow eyebrow-esc">02 · Monitor Popular de Governo</p>
          <h2 id="propostas-titulo">Monitoramento das propostas de campanha</h2>
          <p className="secao-sub">
            A vitória nas urnas é o começo da cobrança popular. Acompanhe o andamento dos 12 compromissos estruturantes do programa democrático-popular por eixo temático.
          </p>
        </div>

        <dl className="placar-propostas" aria-label="Resumo do cumprimento das propostas">
          <div className="pp-cumprida">
            <dt>Consolidadas</dt>
            <dd>{totalCumpridas}</dd>
          </div>
          <div className="pp-andamento">
            <dt>Em andamento</dt>
            <dd>{totalAndamento}</dd>
          </div>
          <div className="pp-articulacao">
            <dt>Em articulação</dt>
            <dd>{totalArticulacao}</dd>
          </div>
          <div className="pp-indice">
            <dt>Índice geral</dt>
            <dd>{mediaProgresso}%</dd>
          </div>
        </dl>
      </div>

      <div className="filtros-barra" role="region" aria-label="Filtros de propostas">
        <div className="filtro-grupo">
          <span className="filtro-rotulo">Eixo temático</span>
          <div className="seletor">
            {EIXOS.map((eixo) => (
              <button
                key={eixo}
                type="button"
                aria-pressed={eixoAtivo === eixo}
                onClick={() => setEixoAtivo(eixo)}
              >
                {eixo}
              </button>
            ))}
          </div>
        </div>

        <div className="filtro-grupo">
          <span className="filtro-rotulo">Estágio de execução</span>
          <div className="seletor">
            <button type="button" aria-pressed={statusFiltro === "Todos"} onClick={() => setStatusFiltro("Todos")}>
              Todas ({PROPOSTAS.length})
            </button>
            <button type="button" aria-pressed={statusFiltro === "cumprida"} onClick={() => setStatusFiltro("cumprida")}>
              Consolidadas ({totalCumpridas})
            </button>
            <button type="button" aria-pressed={statusFiltro === "andamento"} onClick={() => setStatusFiltro("andamento")}>
              Em andamento ({totalAndamento})
            </button>
            <button type="button" aria-pressed={statusFiltro === "nao_iniciada"} onClick={() => setStatusFiltro("nao_iniciada")}>
              Em articulação ({totalArticulacao})
            </button>
            {Object.keys(customStatus).length > 0 && (
              <button type="button" className="btn-reset-status" onClick={restaurarPadrao}>
                Restaurar status oficial
              </button>
            )}
          </div>
        </div>
      </div>

      <ul className="propostas-grade">
        {visiveis.map((p) => {
          const st = statusDe(p);
          const pct = st === "cumprida" ? 100 : st === "nao_iniciada" ? Math.min(p.progresso, 30) : p.progresso;
          return (
            <li key={p.id} className={`proposta-card status-${st}`}>
              <div className="proposta-topo">
                <span className="proposta-num">{p.num}</span>
                <span className="proposta-eixo">{p.eixo}</span>
                <button
                  type="button"
                  className={`proposta-status badge-${st}`}
                  onClick={() => alternarStatus(p)}
                  title="Clique para atualizar o status no seu monitoramento local"
                >
                  {STATUS_LABEL[st]}
                </button>
              </div>

              <h3>{p.titulo}</h3>
              <p className="proposta-promessa">{p.promessa}</p>

              <div className="proposta-progresso">
                <div className="proposta-progresso-cab">
                  <span>Execução estimada da meta</span>
                  <strong>{pct}%</strong>
                </div>
                <div className="b-trilho" aria-hidden="true">
                  <span className={`b-preench preench-${st}`} style={{ width: `${pct}%` }} />
                </div>
              </div>

              <div className="proposta-meta">
                <strong>Marco verificável:</strong> {p.metaIndicador}
              </div>
              <small className="proposta-fonte">Fonte de verificação: {p.fonteAcompanhamento}</small>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
