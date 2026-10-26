"use client";

import { useState } from "react";

export type VertenteEsquerda = "Socialista" | "Comunista" | "Progressista";

export interface PerfilEsquerda {
  id: string;
  num: string;
  nome: string;
  cargo: string;
  partidoOuOrganizacao: string;
  uf: string;
  vertente: VertenteEsquerda;
  bandeiras: string[];
  sintese: string;
  guinadaRadical: string;
}

const VERTENTES: Array<{ filtro: "Todas" | VertenteEsquerda; rotulo: string }> = [
  { filtro: "Todas", rotulo: "Todos" },
  { filtro: "Socialista", rotulo: "Socialistas" },
  { filtro: "Comunista", rotulo: "Comunistas" },
  { filtro: "Progressista", rotulo: "Progressistas" },
];

const PERFIS: PerfilEsquerda[] = [
  {
    id: "erika-hilton",
    num: "01",
    nome: "Erika Hilton",
    cargo: "Deputada Federal",
    partidoOuOrganizacao: "PSOL",
    uf: "SP",
    vertente: "Progressista",
    bandeiras: ["Fim da Escala 6x1", "Direitos Trabalhistas", "Direitos Humanos", "Democracia"],
    sintese:
      "Deputada federal eleita por São Paulo, transformou a PEC pelo fim da jornada 6x1 em mobilização de massas nas ruas e nas redes, reconectando o parlamento às demandas urgentes da classe trabalhadora.",
    guinadaRadical:
      "Rompe com a postura meramente defensiva ao pautar diretamente a redução da jornada de trabalho sem redução salarial, enfrentando o lobby patronal e recolocando o tempo de vida do trabalhador no centro da luta política.",
  },
  {
    id: "samia-bomfim",
    num: "02",
    nome: "Sâmia Bomfim",
    cargo: "Deputada Federal",
    partidoOuOrganizacao: "PSOL",
    uf: "SP",
    vertente: "Socialista",
    bandeiras: ["Socialismo e Direitos das Mulheres", "Defesa do Funcionalismo", "CPIs e Enfrentamento", "Justiça Social"],
    sintese:
      "Servidora pública formada no movimento estudantil da USP, consolidou-se como uma das vozes mais firmes da bancada de esquerda no enfrentamento direto à extrema-direita e ao fisiologismo do Centrão.",
    guinadaRadical:
      "Defende a independência política das lutas populares frente aos limites do presidencialismo de coalizão, articulando greves, movimentos sociais e oposição sem concessões a privatizações e tetos de gastos.",
  },
  {
    id: "renato-freitas",
    num: "03",
    nome: "Renato Freitas",
    cargo: "Deputado Estadual",
    partidoOuOrganizacao: "PT",
    uf: "PR",
    vertente: "Progressista",
    bandeiras: ["Igualdade Racial", "Direito à Cidade", "Direitos Civis", "Escolas Públicas"],
    sintese:
      "Jurista, mestre em Direito pela UFPR e liderança popular no Paraná, protagoniza no Sul do país uma atuação parlamentar firme em defesa dos trabalhadores terceirizados, da educação pública e dos direitos fundamentais.",
    guinadaRadical:
      "Tensiona as estruturas conservadoras dentro e fora do parlamento paranaense, recusando a domesticação institucional e unindo formação jurídica crítica à mobilização ao lado de trabalhadores e estudantes.",
  },
  {
    id: "jones-manoel",
    num: "04",
    nome: "Jones Manoel",
    cargo: "Historiador, Professor e Comunicador Popular",
    partidoOuOrganizacao: "Campo Marxista",
    uf: "PE",
    vertente: "Comunista",
    bandeiras: ["Poder Popular", "Marxismo Anticolonial", "Soberania Popular", "Crítica ao Neoliberalismo"],
    sintese:
      "Historiador pernambucano, mestre em Serviço Social pela UFPE e um dos principais divulgadores do pensamento marxista no Brasil contemporâneo, aproximando autores clássicos como Frantz Fanon, Lênin e Clóvis Moura de uma nova geração.",
    guinadaRadical:
      "Formula uma crítica contundente aos limites da conciliação de classes e do arcabouço fiscal, defendendo que a esquerda retome o trabalho de base, o horizonte socialista e a ruptura com a dependência econômica.",
  },
  {
    id: "ana-elisa",
    num: "05",
    nome: "Ana Elisa",
    cargo: "Comunicadora Política e Militante",
    partidoOuOrganizacao: "Comunicação Marxista",
    uf: "BR",
    vertente: "Comunista",
    bandeiras: ["Formação Política", "Comunicação Anticapitalista", "Juventude Trabalhadora", "Direitos da Classe Trabalhadora"],
    sintese:
      "Representante da nova geração de comunicadoras e organizadoras políticas que disputam a hegemonia nas redes digitais com linguagem acessível, rigor teórico e foco na consciência de classe da juventude trabalhadora.",
    guinadaRadical:
      "Traduz debates estruturais sobre mais-valia, precarização do trabalho e soberania para o cotidiano de jovens estudantes e trabalhadores, rompendo a hegemonia conservadora nos espaços digitais.",
  },
  {
    id: "guilherme-cortez",
    num: "06",
    nome: "Guilherme Cortez",
    cargo: "Deputado Estadual",
    partidoOuOrganizacao: "PSOL",
    uf: "SP",
    vertente: "Progressista",
    bandeiras: ["Contra Privatizações", "Educação Pública", "Direitos Civis", "Juventude e Clima"],
    sintese:
      "Advogado formado pela UNESP de Franca e ex-militante do movimento estudantil, destaca-se na Assembleia Legislativa de São Paulo na linha de frente contra a privatização da Sabesp, do transporte ferroviário e do ensino público.",
    guinadaRadical:
      "Combina obstrução parlamentar combativa com mobilização de sindicatos e estudantes, defendendo o controle público sobre setores estratégicos como saneamento, energia e educação.",
  },
  {
    id: "elias-jabbour",
    num: "07",
    nome: "Elias Jabbour",
    cargo: "Economista Político e Professor da UERJ",
    partidoOuOrganizacao: "PCdoB",
    uf: "RJ",
    vertente: "Comunista",
    bandeiras: ["Nova Economia do Projetamento", "Soberania Nacional", "Reindustrialização", "Sul Global e BRICS"],
    sintese:
      "Professor associado da UERJ e vencedor do Special Book Award of China, é uma das principais referências teóricas no debate sobre planejamento estatal, reindustrialização soberana e multipolaridade.",
    guinadaRadical:
      "Desmonta os dogmas da austeridade fiscal e do Banco Central dito independente, propondo um Estado planejador capaz de coordenar grandes projetos de infraestrutura, ciência de ponta e pleno emprego.",
  },
  {
    id: "glauber-braga",
    num: "08",
    nome: "Glauber Braga",
    cargo: "Deputado Federal",
    partidoOuOrganizacao: "PSOL",
    uf: "RJ",
    vertente: "Socialista",
    bandeiras: ["Enfrentamento ao Orçamento Secreto", "Petrobras 100% Estatal", "Soberania Energética", "Poder Popular"],
    sintese:
      "Conhecido pela intransigência na defesa dos bens públicos e pela denúncia aberta das emendas impositivas e da privatização de estatais estratégicas no Congresso Nacional.",
    guinadaRadical:
      "Recusa acordos de bastidores e defende que o mandato parlamentar funcione como instrumento direto das greves e mobilizações populares contra o sequestro do orçamento público pelo fisiologismo.",
  },
  {
    id: "leo-pericles",
    num: "09",
    nome: "Leo Péricles",
    cargo: "Presidente Nacional da Unidade Popular",
    partidoOuOrganizacao: "UP",
    uf: "MG",
    vertente: "Socialista",
    bandeiras: ["Reforma Urbana (MLB)", "Socialismo Popular", "Trabalho de Base", "Auditoria da Dívida"],
    sintese:
      "Dirigente nacional da Unidade Popular pelo Socialismo (UP) e do Movimento de Luta nos Bairros, Vilas e Favelas (MLB), constrói uma atuação política enraizada nos movimentos por moradia e transporte público.",
    guinadaRadical:
      "Coloca a organização de base nos bairros trabalhadores como motor de transformação estrutural, defendendo a superação das desigualdades e o fortalecimento do poder popular.",
  },
];

export default function EsquerdaRadical() {
  const [vertente, setVertente] = useState<"Todas" | VertenteEsquerda>("Todas");
  const [expandido, setExpandido] = useState<Record<string, boolean>>({});

  const visiveis = PERFIS.filter((p) => vertente === "Todas" || p.vertente === vertente);

  const toggleExpandido = (id: string) => {
    setExpandido((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section className="secao-editorial secao-clara" id="esquerda" aria-labelledby="esquerda-titulo">
      <div className="secao-cab">
        <div>
          <p className="eyebrow eyebrow-esc">04 · Renovação Política e Horizonte Socialista</p>
          <h2 id="esquerda-titulo">Vozes da esquerda: socialistas, comunistas e progressistas</h2>
          <p className="secao-sub">
            Enquanto o campo democrático celebra a vitória nas urnas, uma geração de parlamentares, intelectuais e lideranças populares impulsiona uma esquerda mais propositiva e combativa: pautando o fim da escala 6x1, o planejamento estatal soberano e a defesa intransigente dos direitos sociais.
          </p>
        </div>

        <div className="manifesto-radical">
          <strong>Por que a esquerda está se renovando?</strong>
          <p>
            Ir à raiz dos problemas significa superar o imobilismo fiscal e apresentar respostas concretas para a jornada de trabalho, a reindustrialização nacional e a qualidade dos serviços públicos.
          </p>
        </div>
      </div>

      <div className="filtros-barra" role="region" aria-label="Filtrar por corrente política">
        <div className="filtro-grupo">
          <span className="filtro-rotulo">Corrente política</span>
          <div className="seletor">
            {VERTENTES.map((v) => (
              <button
                key={v.filtro}
                type="button"
                aria-pressed={vertente === v.filtro}
                onClick={() => setVertente(v.filtro)}
              >
                {v.rotulo}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ul className="esquerda-grade">
        {visiveis.map((p) => {
          const aberto = !!expandido[p.id];
          return (
            <li key={p.id} className="esquerda-card">
              <div className="ec-topo">
                <span className="ec-num">{p.num}</span>
                <span className="ec-frente">{p.vertente}</span>
                <span className="uf">{p.uf}</span>
              </div>

              <div className="ec-identidade">
                <h3>{p.nome}</h3>
                <p className="ec-cargo">
                  <strong>{p.partidoOuOrganizacao}</strong> · {p.cargo}
                </p>
              </div>

              <ul className="ec-bandeiras" aria-label="Bandeiras principais">
                {p.bandeiras.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>

              <p className="ec-sintese">{p.sintese}</p>

              <div className="ec-radical-box">
                <button
                  type="button"
                  className="ec-btn-radical"
                  aria-expanded={aberto}
                  onClick={() => toggleExpandido(p.id)}
                >
                  <span>Tese e ruptura política</span>
                  <span aria-hidden="true">{aberto ? "−" : "+"}</span>
                </button>
                {aberto && <p className="ec-radical-texto">{p.guinadaRadical}</p>}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
