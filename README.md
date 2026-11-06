# VoVira 🇧🇷

> **Plataforma web de inteligência territorial, memória da vitória democrática de 2026 e monitoramento popular do novo mandato de Luiz Inácio Lula da Silva — baseada exclusivamente em dados públicos oficiais (TSE, IBGE, Câmara dos Deputados e Banco Central).**

- 🌐 **Produção (Vercel):** https://web-blush-kappa-88.vercel.app
- 📦 **Repositório Oficial:** https://github.com/jvalb/VoVira

---

## 📌 Visão Geral

O **VoVira** nasceu como ferramenta de inteligência territorial para o 2º turno presidencial de 2026 e evoluiu, após a confirmação oficial da reeleição de Luiz Inácio Lula da Silva pelo TSE (**64.256.232 votos válidos — 51,79%** na Eleição Ordinária Federal `6258`), para um observatório permanente de acompanhamento popular, análise regional comparativa e formação política.

A plataforma articula cinco frentes complementares:
1. **Vitória Democrática e Parabenização ao Presidente Reeleito:** Placar oficial consolidado do 2º turno de 2026 e síntese dos compromissos com a soberania nacional, a justiça tributária e os direitos sociais.
2. **Monitor Popular de Propostas de Campanha:** Acompanhamento dos 12 compromissos estruturantes do programa de governo em 5 eixos temáticos, com **status bloqueados contra edição pública** e **sincronização automática + curadoria interna** via API de Dados Abertos da Câmara dos Deputados e Banco Central.
3. **Comparativo Regional (1º Turno × 2º Turno de 2026 e 2º Turno de 2022):** Balanço de votos, crescimento absoluto e variação em pontos percentuais nas 5 macrorregiões do IBGE e nas 27 Unidades da Federação + Exterior (`ZZ`).
4. **Vozes da Esquerda (`Socialistas`, `Comunistas` e `Progressistas`):** Painel de parlamentares, intelectuais e lideranças populares que impulsionam pautas estruturais como o fim da escala 6x1, a reforma urbana e a soberania popular.
5. **Mapa Coroplético e Raio-X dos 5.570 Municípios e 18.858 Zonas Eleitorais:** Consulta direta por município com indicadores do Censo Demográfico 2022 (IBGE) e votação detalhada por zona eleitoral.

---

## 🛡️ Princípios de Integridade e Transparência

- **Dados 100% Oficiais e Inalterados:**
  - **TSE (1º e 2º Turnos de 2022 e 2026):** Arquivos de detalhe de votação por município e zona eleitoral e JSONs consolidados da Eleição Federal `6258` (`resultados.tse.jus.br`).
  - **IBGE (Censo Demográfico 2022):** População residente, alfabetização, abastecimento de água, esgotamento sanitário, coleta de lixo e conectividade via API SIDRA.
  - **Câmara dos Deputados & BCB:** Situação de tramitação legislativa em tempo real (`dadosabertos.camara.leg.br/api/v2/proposicoes`) e série histórica oficial do Salário Mínimo (`api.bcb.gov.br` — SGS 1619).
- **Sem Pré-arredondamento em Disco:** As bases preservam os inteiros exatos de cada município, UF e zona eleitoral; percentuais, margens e variações são calculados em tempo de execução.
- **Status de Propostas Protegidos:** O usuário final visualiza e filtra as propostas sem poder adulterar seus status. Qualquer atualização ocorre exclusivamente por sincronização oficial automática ou comando interno autenticado.
- **Auditabilidade Pública (`/fontes`):** Página dedicada com todos os hashes criptográficos `SHA-256` dos arquivos brutos, endpoints consultados e fórmulas matemáticas utilizadas.

---

## 🚀 Funcionalidades Principais

### 1. Monitor Popular de Propostas (`#propostas`)
- **12 compromissos estruturantes** distribuídos em 5 eixos: *Economia e Trabalho*, *Social e Saúde*, *Educação e Ciência*, *Clima e Amazônia* e *Democracia e Soberania*.
- Placar consolidado no topo (*Consolidadas*, *Em andamento*, *Em articulação* e *Índice geral de execução*).
- Cada card exibe:
  - Estágio de execução (somente leitura para visitantes);
  - Barra de progresso aferida;
  - Marco verificável e órgão oficial de acompanhamento;
  - **Código da proposição legislativa, situação ao vivo na Câmara dos Deputados e link direto para a ficha oficial de tramitação**.

### 2. Comparativo Regional 1º × 2º Turno (`#comparativo`)
- Alternância entre dois modos de análise:
  - **Salto no 2º Turno (`1º Turno 2026 → 2º Turno 2026`)**: mostra quantos novos votos Lula e o oponente somaram entre o 1º e o 2º turno de 2026 em cada região.
  - **Evolução Histórica (`2º Turno 2022 → 2º Turno 2026`)**: compara o desempenho do 2º turno de 2026 com o 2º turno de 2022.
- Cards das 5 macrorregiões (*Nordeste*, *Norte*, *Sudeste*, *Sul* e *Centro-Oeste*) e tabela interativa das **27 UFs + Exterior (`ZZ`)**.

### 3. Vozes da Esquerda (`#esquerda`)
- Filtro por corrente política: **Todos**, **Socialistas**, **Comunistas** e **Progressistas**.
- Apresenta organização/partido, território de atuação, pautas prioritárias e bio de nomes como Erika Hilton, Guilherme Boulos, Glauber Braga, Jones Manoel, Sabrina Fernandes, João Pedro Stédile, Humberto Matos, Renato Freitas e Laura Carvalho.

### 4. Mapa Eleitoral e Painel Territorial (`#mapa`)
- Mapa WebGL (MapLibre GL JS) com os 5.570 municípios brasileiros e seletor de métricas (*Margem Lula vs Oponente*, *Votação Lula %*, *Votação Oponente %*, *Abstenção %*, *Variação vs 2022* e *Meta de Virada*).
- Painel lateral direto com placar nacional/municipal, histórico comparativo, indicadores do Censo 2022 (Município × UF × Brasil) e tabela de zonas eleitorais.

---

## 🔄 Como Funciona a Atualização das Propostas

O Monitor de Propostas conta com um **motor híbrido em 3 camadas** que impede alterações pelo público externo e mantém os dados sempre atualizados:

### Camada 1 — Sincronização Automática em Tempo Real na Vercel (`/api/propostas`)
A rota [`web/app/api/propostas/route.ts`](web/app/api/propostas/route.ts) possui *Incremental Static Regeneration* (`revalidate = 3600` — 1 hora). A cada hora, o backend consulta automaticamente a **API de Dados Abertos da Câmara dos Deputados** (`https://dadosabertos.camara.leg.br/api/v2/proposicoes/{camaraId}`) para todas as 12 propostas e atualiza a situação legislativa, o despacho mais recente e o status (respeitando propostas travadas com `overrideManual: true`).

### Camada 2 — Automação Diária e Painel Manual no GitHub Actions
O workflow [`.github/workflows/update-propostas.yml`](.github/workflows/update-propostas.yml) opera de duas formas:
1. **Automático (Cron Diário às 08:00 BRT):** Roda `python3 pipeline/03_update_propostas.py --auto`, consulta a Câmara dos Deputados e o Banco Central (SGS 1619) e faz commit/push automático em `web/public/data/propostas.json` caso algum indicador ou tramitação tenha mudado.
2. **Manual pela interface do GitHub (`workflow_dispatch`):** Na aba **Actions → Atualizar Monitor de Propostas → Run workflow**, o mantenedor do repositório pode escolher `modo = manual` e informar `proposta_id`, `status`, `progresso` e `marco` diretamente pelo navegador.

### Camada 3 — CLI Manual Interna pelo Terminal
Para gerenciar as propostas localmente a partir da pasta `web/`:

```bash
# 1. Listar todas as propostas, status, percentuais e modo (AUTO vs MANUAL)
npm run propostas:list

# 2. Forçar varredura automática imediata nas APIs da Câmara e do Banco Central
npm run propostas:sync

# 3. Atualizar manualmente uma proposta específica (ativa overrideManual=true)
npm run propostas:set -- --id escala-6x1 --status cumprida --progresso 100 --marco "Regulamentação setorial da EC 141/2026 concluída"

# 4. Remover trava manual para que a proposta volte a ser calculada automaticamente
npm run propostas:set -- --id escala-6x1 --unlock-auto
```

---

## 🏗️ Arquitetura do Projeto

```
VoVira/
├── .github/workflows/
│   └── update-propostas.yml   # Cron diário + painel manual (workflow_dispatch) de propostas
├── data/
│   ├── certs/                 # Cadeia ICP-Brasil / Sectigo para verificação TLS
│   └── raw/                   # Manifesto SHA-256 e JSONs brutos do TSE (1º e 2º turnos) e IBGE
├── pipeline/
│   ├── 01_fetch.py            # Download das bases de 2022, 2026 (1ºT) e Censo IBGE 2022
│   ├── 01b_fetch_2026t2.py    # Download e auditoria aritmética do 2º turno oficial de 2026 (TSE 6258)
│   ├── 02_build.py            # Consolidação de 18.858 zonas, 5.570 municípios e agregados por UF/BR
│   ├── 03_update_propostas.py # Motor automático (API Câmara + BCB) e CLI manual de propostas
│   └── http_util.py           # Cliente HTTP com verificação TLS estrita
├── web/
│   ├── app/
│   │   ├── api/
│   │   │   ├── meta/          # Metadados e agregados nacionais/estaduais (2022, 2026t1, 2026t2)
│   │   │   ├── municipio/[c]/ # Dados eleitorais, zonas e Censo 2022 por código IBGE
│   │   │   ├── propostas/     # Sincronização ISR (1h) com a Câmara + POST interno protegido
│   │   │   ├── ranking/       # Rankings de municípios por UF
│   │   │   └── resumo/        # Payload enxuto para renderização do mapa coroplético
│   │   ├── fontes/            # Página de Fontes, Metodologia e Auditoria SHA-256
│   │   └── globals.css        # Sistema tipográfico (Anton + Plus Jakarta Sans) e estilos
│   ├── components/
│   │   ├── App.tsx                # Orquestração das seções e do mapa interativo
│   │   ├── Hero.tsx               # Hero comemorativo + seção de parabenização ao Presidente
│   │   ├── MonitorPropostas.tsx   # Monitor Popular de Governo (somente leitura no cliente)
│   │   ├── ComparativoRegional.tsx# Comparativo 1º × 2º turno por Região e UF
│   │   ├── EsquerdaRadical.tsx    # Vozes da Esquerda (Socialistas, Comunistas e Progressistas)
│   │   ├── MapView.tsx            # Mapa coroplético MapLibre GL JS
│   │   ├── Nacional.tsx           # Resumo nacional no painel lateral
│   │   └── Painel.tsx             # Detalhe municipal, Censo 2022 e zonas eleitorais
│   ├── lib/                   # Cálculos puros, agregações regionais e suíte de testes (Vitest)
│   └── public/data/           # Bases servidas (meta.json, municipios.json, zonas.json, propostas.json)
├── Dockerfile                 # Multi-stage build para produção
└── docker-compose.yml         # Orquestração de container
```

---

## ⚙️ Instalação, Execução e Testes

### Pré-requisitos
- **Node.js 20+** e `npm`
- **Python 3.10+** (para executar os scripts de sincronização e ETL em `pipeline/`)

### 1. Ambiente de Desenvolvimento

```bash
cd web
npm install
npm run dev
# Acesse http://localhost:3000
```

### 2. Verificação de Qualidade e Testes Automatizados

```bash
cd web
npm run typecheck   # Verificação estática TypeScript (tsc --noEmit)
npm run lint        # ESLint Next.js
npm test            # 26 testes unitários e de integridade de dados (Vitest)
```

### 3. Reproduzindo o Pipeline Completo de Dados

```bash
# 1. Baixar dados de 2022, 1º turno 2026 e Censo IBGE 2022
python3 pipeline/01_fetch.py

# 2. Baixar resultados oficiais consolidados do 2º turno de 2026 (Eleição TSE 6258)
python3 pipeline/01b_fetch_2026t2.py

# 3. Construir web/public/data/{meta,municipios,zonas,malha}.json
python3 pipeline/02_build.py

# 4. Sincronizar o Monitor de Propostas com as APIs da Câmara e do Banco Central
python3 pipeline/03_update_propostas.py --auto
```

---

## 📊 Fórmulas e Metodologia

1. **Percentual de Votos Válidos:**
   $$\%_{\text{válidos}} = \frac{\text{votos do candidato}}{\text{total de votos válidos}} \times 100$$

2. **Margem Direta (Votos e Pontos Percentuais):**
   $$\text{Margem}_{\text{votos}} = \text{votos Lula} - \text{votos Oponente}$$
   $$\text{Margem}_{\text{p.p.}} = \%_{\text{Lula}} - \%_{\text{Oponente}}$$

3. **Variação entre Turnos por Região / UF:**
   $$\Delta_{\text{votos}} = \text{votos}_{\text{2º Turno}} - \text{votos}_{\text{1º Turno}}$$
   $$\Delta_{\text{p.p.}} = \%_{\text{2º Turno}} - \%_{\text{1º Turno}}$$

4. **Identidades Aritméticas Auditadas em 100% das Urnas/UFs:**
   $$\sum \text{votos nominais} = \text{votos válidos}$$
   $$\text{votos válidos} + \text{brancos} + \text{nulos} = \text{comparecimento}$$
   $$\text{comparecimento} + \text{abstenção} = \text{eleitorado apto}$$

---

## 📜 Licença e Transparência

Todos os dados eleitorais, demográficos e legislativos utilizados são públicos sob a Lei de Acesso à Informação (Lei nº 12.527/2011). O código-fonte é aberto para fins cívicos, acadêmicos e de controle social democrático.
