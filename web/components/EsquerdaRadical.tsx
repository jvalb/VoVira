"use client";

import { useState } from "react";

export type FrenteEsquerda = "Parlamento Combativo" | "Marxismo e Soberania" | "Periferia e Base Popular";

export interface PerfilEsquerda {
  id: string;
  num: string;
  nome: string;
  cargo: string;
  partidoOuOrganizacao: string;
  uf: string;
  frente: FrenteEsquerda;
  bandeiras: string[];
  sintese: string;
  guinadaRadical: string;
}

const FRENTES: Array<"Todas" | FrenteEsquerda> = [
  "Todas",
  "Parlamento Combativo",
  "Marxismo e Soberania",
  "Periferia e Base Popular",
];

const PERFIS: PerfilEsquerda[] = [
  {
    id: "erika-hilton",
    num: "01",
    nome: "Erika Hilton",
    cargo: "Deputada Federal",
    partidoOuOrganizacao: "PSOL",
    uf: "SP",
    frente: "Parlamento Combativo",
    bandeiras: ["Fim da Escala 6x1", "Direitos Trabalhistas", "Transfeminismo", "Direitos Humanos"],
    sintese:
      "Primeira deputada federal negra e trans eleita por São Paulo, transformou a pauta pelo fim da jornada 6x1 em mobilização de massas nas ruas e nas redes, reconectando o parlamento às dores reais da classe trabalhadora.",
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
    frente: "Parlamento Combativo",
    bandeiras: ["Feminismo Socialista", "Defesa do Funcionalismo", "CPIs e Enfrentamento", "Justiça Social"],
    sintese:
      "Servidora pública formada no movimento estudantil da USP, consolidou-se como uma das vozes mais firmes da bancada de esquerda no enfrentamento direto à extrema-direita e ao fisiologismo do Centrão.",
    guinadaRadical:
      "Defende a independência política das lutas populares frente aos limites do presidencialismo de coalizão, articulando greves, movimentos feministas e oposição sem concessões a privatizações e tetos de gastos.",
  },
  {
    id: "renato-freitas",
    num: "03",
    nome: "Renato Freitas",
    cargo: "Deputado Estadual",
    partidoOuOrganizacao: "PT",
    uf: "PR",
    frente: "Periferia e Base Popular",
    bandeiras: ["Antirracismo Radical", "Direito à Cidade", "Desmilitarização", "Escolas Públicas"],
    sintese:
      "Jurista, mestre em Direito pela UFPR e liderança nascida nas periferias, protagoniza no Sul do país uma esquerda enraizada na juventude negra, nos trabalhadores terceirizados e na luta contra a violência policial.",
    guinadaRadical:
      "Tensiona as estruturas conservadoras dentro e fora do parlamento paranaense, recusando a domesticação institucional e unindo formação jurídica crítica à ação direta ao lado de movimentos de bairro e estudantes.",
  },
  {
    id: "jones-manoel",
    num: "04",
    nome: "Jones Manoel",
    cargo: "Historiador, Professor e Comunicador Popular",
    partidoOuOrganizacao: "Campo Marxista Revolucionário",
    uf: "PE",
    frente: "Marxismo e Soberania",
    bandeiras: ["Poder Popular", "Marxismo Anticolonial", "Revolução Brasileira", "Crítica ao Neoliberalismo"],
    sintese:
      "Historiador pernambucano, mestre em Serviço Social pela UFPE e um dos principais divulgadores do marxismo no Brasil contemporâneo, aproximando clássicos como Frantz Fanon, Lênin e Clóvis Moura de uma nova geração.",
    guinadaRadical:
      "Formula uma crítica contundente aos limites da conciliação de classes e do arcabouço fiscal, defendendo que a esquerda retome o trabalho de base, a horizonte socialista e a ruptura com a dependência econômica.",
  },
  {
    id: "ana-elisa",
    num: "05",
    nome: "Ana Elisa",
    cargo: "Comunicadora Política e Militante Socialista",
    partidoOuOrganizacao: "Esquerda Radical / Agitação Digital",
    uf: "BR",
    frente: "Periferia e Base Popular",
    bandeiras: ["Formação de Base", "Comunicação Anticapitalista", "Juventude Trabalhadora", "Feminismo Classista"],
    sintese:
      "Representante da nova geração de comunicadoras e organizadoras políticas que disputam a hegemonia nas redes digitais com linguagem acessível, rigor político e foco na consciência de classe da juventude precarizada.",
    guinadaRadical:
      "Traduz debates estruturais sobre mais-valia, precarização do trabalho e imperialismo para o cotidiano de jovens estudantes e trabalhadores, rompendo a hegemonia da direita nos espaços digitais.",
  },
  {
    id: "guilherme-cortez",
    num: "06",
    nome: "Guilherme Cortez",
    cargo: "Deputado Estadual",
    partidoOuOrganizacao: "PSOL",
    uf: "SP",
    frente: "Parlamento Combativo",
    bandeiras: ["Contra Privatizações", "Educação Pública", "Direitos LGBTQIAPN+", "Juventude e Clima"],
    sintese:
      "Advogado formado pela UNESP de Franca e ex-militante do movimento estudantil, destaca-se na Assembleia Legislativa de São Paulo na linha de frente contra a privatização da Sabesp, do transporte ferroviário e do ensino público.",
    guinadaRadical:
      "Combina obstrução parlamentar combativa com mobilização de sindicatos e estudantes, defendendo o controle público sobre setores estratégicos como água, energia e educação.",
  },
  {
    id: "elias-jabbour",
    num: "07",
    nome: "Elias Jabbour",
    cargo: "Economista Político e Professor da UERJ",
    partidoOuOrganizacao: "Pensamento Estratégico / PCdoB",
    uf: "RJ",
    frente: "Marxismo e Soberania",
    bandeiras: ["Nova Economia do Projetamento", "Soberania Nacional", "Reindustrialização", "Sul Global e BRICS"],
    sintese:
      "Professor associado da UERJ e vencedor do Special Book Award of China, é uma das principais referências teóricas no debate sobre planejamento estatal, reindustrialização soberana e multipolaridade.",
    guinadaRadical:
      "Desmonta os dogmas da austeridade fiscal e do Banco Central 'independente', propondo um Estado planejador capaz de coordenar grandes projetos de infraestrutura, ciência de ponta e pleno emprego.",
  },
  {
    id: "glauber-braga",
    num: "08",
    nome: "Glauber Braga",
    cargo: "Deputado Federal",
    partidoOuOrganizacao: "PSOL",
    uf: "RJ",
    frente: "Parlamento Combativo",
    bandeiras: ["Enfrentamento ao Orçamento Secreto", "Petrobras 100% Estatal", "Soberania Energética", "Poder Popular"],
    sintese:
      "Conhecido pela intransigência na defesa dos bens públicos e pela denúncia aberta das emendas impositivas e da privatização de estatais estratégicas no Congresso Nacional.",
    guinadaRadical:
      "Recusa acordos de bastidores e defende que o mandato parlamentar funcione como megafone das greves e ocupações populares contra o sequestro do orçamento público pelo fisiologismo.",
  },
  {
    id: "leo-pericles",
    num: "09",
    nome: "Leo Péricles",
    cargo: "Presidente Nacional da Unidade Popular",
    partidoOuOrganizacao: "UP",
    uf: "MG",
    frente: "Periferia e Base Popular",
    bandeiras: ["Moradia Popular (MLB)", "Socialismo Revolucionário", "Organização nos Bairros", "Auditoria da Dívida"],
    sintese:
      "Morador da ocupação Eliana Silva no Barreiro (Belo Horizonte) e dirigente do Movimento de Luta nos Bairros, Vilas e Favelas (MLB), constrói o partido mais jovem da esquerda revolucionária brasileira a partir das ocupações urbanas.",
    guinadaRadical:
      "Coloca a auto-organização das favelas, ocupações e periferias como motor de transformação estrutural, defendendo a superação do capitalismo e o poder popular direto.",
  },
];

export default function EsquerdaRadical() {
  const [frente, setFrente] = useState<"Todas" | FrenteEsquerda>("Todas");
  const [expandido, setExpandido] = useState<Record<string, boolean>>({});

  const visiveis = PERFIS.filter((p) => frente === "Todas" || p.frente === frente);

  const toggleExpandido = (id: string) => {
    setExpandido((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section className="secao-editorial secao-clara" id="esquerda" aria-labelledby="esquerda-titulo">
      <div className="secao-cab">
        <div>
          <p className="eyebrow eyebrow-esc">04 · Renovação Política e Horizonte Socialista</p>
          <h2 id="esquerda-titulo">Vozes da esquerda combativa e radical</h2>
          <p className="secao-sub">
            Enquanto o campo democrático celebra a derrota do extremismo nas urnas, uma geração de parlamentares, intelectuais marxistas e lideranças populares impulsiona a migração para uma esquerda mais radical: sem medo de pautar o fim da escala 6x1, o planejamento estatal soberano e o poder popular nas periferias.
          </p>
        </div>

        <div className="manifesto-radical">
          <strong>Por que a esquerda está se radicalizando?</strong>
          <p>
            Radicalizar é ir à raiz dos problemas. Diante da precarização do trabalho, da crise climática e da ofensiva da extrema-direita, cresceram no Brasil as correntes que recusam o imobilismo fiscal e defendem reformas estruturais profundas.
          </p>
        </div>
      </div>

      <div className="filtros-barra" role="region" aria-label="Filtrar por frente de atuação">
        <div className="filtro-grupo">
          <span className="filtro-rotulo">Frente de atuação política</span>
          <div className="seletor">
            {FRENTES.map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={frente === f}
                onClick={() => setFrente(f)}
              >
                {f}
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
                <span className="ec-frente">{p.frente}</span>
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
