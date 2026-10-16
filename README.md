# VoVira 🇧🇷

> **Plataforma web de inteligência territorial e diálogo eleitoral baseada exclusivamente em dados públicos oficiais (TSE e IBGE), orientada para a mobilização cidadã e virada de votos em prol da candidatura de Luiz Inácio Lula da Silva no 2º turno de 2026.**

---

## 📌 Visão Geral

O **VoVira** é uma aplicação web interativa que combina resultados eleitorais oficiais detalhados por município e zona eleitoral (TSE) com indicadores socioeconômicos do Censo Demográfico 2022 (IBGE).

A ferramenta foi projetada para responder a duas necessidades centrais de militantes, lideranças comunitárias e eleitores engajados:
1. **Onde atuar com maior eficiência?** Identificar municípios e zonas com maior contingente de votos a virar, abstenções mobilizáveis ou votos de terceiros candidatos disponíveis.
2. **Como dialogar com respeito e eficácia?** Fornecer ganchos de conversa fundamentados na realidade concreta do território (acesso a água, saneamento básico, coleta de lixo, conectividade e alfabetização), confrontando as necessidades locais com as propostas oficiais dos planos de governo.

---

## 🛡️ Princípios de Integridade e Ética

- **Dados 100% Oficiais e Inalterados:** As votações derivam diretamente dos arquivos de detalhe e boletins de urna do Tribunal Superior Eleitoral (TSE Dados Abertos). Os indicadores sociais provêm do SIDRA/Censo 2022 do Instituto Brasileiro de Geografia e Estatística (IBGE).
- **Sem Pré-arredondamento em Disco:** A base de dados preserva as somas inteiras exatas de cada município e zona. Todas as porcentagens e margens são calculadas em tempo de execução no cliente.
- **Transparência e Auditabilidade:** Todo o pipeline registra os hashes criptográficos SHA-256 dos arquivos de origem, permitindo verificação pública na rota `/fontes`.
- **Conformidade com a Legislação Eleitoral:** As orientações de campo reforçam expressamente os limites da Lei nº 9.504/1997 e da Resolução TSE nº 23.610/2019: proibição rigorosa de compra de votos, fornecimento de alimentação, transporte ilegal e propagação de desinformação.

---

## 🚀 Funcionalidades

### 1. Mapa Coroplético dos 5.570 Municípios
- Renderizado com MapLibre GL JS e WebGL de alto desempenho.
- Permite alternar métricas: *Margem Lula vs Oponente (p.p.)*, *Votação Lula (%)*, *Votação Oponente (%)*, *Abstenção (%)*, *Variação vs 2022 (p.p.)* e *Meta de Virada (votos necessários)*.
- Cores dinâmicas interpoladas via `feature-state` com suporte a zoom suave e seleção visual.

### 2. Painel Territorial Completo
- **Placar do 1º Turno 2026:** Percentuais válidos de Lula, oponente, abstenção e população do Censo 2022.
- **Metas de Virada:** Cálculo exato de quantos novos votos (de abstenção/brancos/nulos) ou quantas trocas de lado são matematicamente necessárias para Lula assumir a liderança na cidade.
- **Histórico Comparativo (Presidente):** Comparação tabular direta entre o 1º turno de 2022, 2º turno de 2022 e 1º turno de 2026.
- **Perfil do Território (Censo 2022):** Tabela comparativa dos 5 indicadores do município vs média do Estado vs média do Brasil.

### 3. Zonas Eleitorais Detalhadas
- Listagem completa de todas as zonas eleitorais do município selecionado (ex.: 58 zonas em São Paulo, 49 no Rio de Janeiro).
- Coluna exclusiva **Virada / Vantagem**: destaca em vermelho a meta exata de votos para virar em cada zona onde Lula ficou atrás, e em verde as zonas onde lidera.

### 4. Ganchos de Conversa e Mobilização
- Recomendações determinísticas de abordagem baseadas nas fragilidades estruturais apontadas pelo IBGE (ex.: bairros sem saneamento, déficit de água encanada, baixa conectividade).
- Citação direta da fonte oficial e link para a tabela SIDRA correspondente.

### 5. Ferramentas de Campo (WhatsApp, Compartilhamento e Impressão)
- **Copiar Roteiro:** Formata um roteiro completo em texto puro para WhatsApp/Telegram com resumo do resultado local, metas de virada, pontos de diálogo com dados oficiais, lembretes legais e link direto.
- **Botão WhatsApp:** Compartilha instantaneamente via API oficial do WhatsApp ou Web Share API no celular.
- **Imprimir / Salvar PDF:** Folha de estilo `@media print` otimizada para impressão em uma página (panfletagem e comitês de bairro), ocultando mapa e menus e formatando os dados em alto contraste.
- **Deep Linking por URL (`?m=CODIGO_IBGE`):** Permite compartilhar links diretos para qualquer município brasileiro (ex.: `https://vovira.app/?m=3550308` para São Paulo).

### 6. Simulador de Cenários Interativo
- Sliders interativos para testar hipóteses no 2º turno:
  - Percentual de abstenção mobilizado e taxa de preferência para Lula.
  - Taxa de transferência de votos de outros candidatos para Lula e oponente.
- Cálculo em tempo real do novo placar e do ganho líquido de votos.

### 7. Onde Atuar (Rankings Estratégicos)
- Filtro por Unidade da Federação (ou Brasil inteiro).
- 4 abas de priorização:
  - **Mobilização:** Municípios com maior ganho potencial ao reduzir a abstenção onde Lula lidera.
  - **Persuasão:** Municípios com maior volume de votos de terceiros candidatos.
  - **Recuperação:** Municípios onde Lula teve maior perda relativa em relação a 2022.
  - **Equilíbrio:** Municípios mais acirrados com menor diferença absoluta de votos.

---

## 🏗️ Arquitetura do Sistema

```
VoVira/
├── data/
│   ├── certs/                 # Certificado intermediário Sectigo para API IBGE
│   └── raw/                   # Manifesto SHA-256 das fontes oficiais
├── pipeline/
│   ├── 01_fetch.py            # Download automatizado de TSE e IBGE com verificação TLS
│   ├── 02_build.py            # Consolidação, reconciliação TSE-IBGE e geração de JSONs
│   └── http_util.py           # Cliente HTTP com injeção segura de cadeia de certificados
├── web/
│   ├── app/
│   │   ├── api/
│   │   │   ├── meta/          # Metadados e agregados nacionais
│   │   │   ├── municipio/[c]/ # Perfil completo, zonas e insights do município
│   │   │   ├── ranking/       # Listas estratégicas de atuação com filtro de UF
│   │   │   └── resumo/        # Payload otimizado para o mapa coroplético
│   │   ├── fontes/            # Página de auditoria pública, hashes e metodologia
│   │   └── globals.css        # Estilos responsivos, acessibilidade e CSS de impressão
│   ├── components/            # Componentes React 19 (MapView, Painel, Simulador, etc.)
│   ├── lib/                   # Lógica pura de cálculo (métricas, virada, ranking, share)
│   └── public/data/           # Bases consolidadas (malha.geojson, municipios.json, zonas.json)
├── Dockerfile                 # Multi-stage build para produção
└── docker-compose.yml         # Orquestração de container
```

---

## ⚙️ Instalação e Execução Local

### Pré-requisitos
- Node.js 20+ e npm
- Python 3.10+ (apenas se for reexecutar o pipeline de dados)

### 1. Executando a Aplicação Web

```bash
# Entre na pasta da aplicação web
cd web

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev

# Acesse http://localhost:3000 no navegador
```

### 2. Build de Produção

```bash
cd web
npm run build
npm run start
```

### 3. Executando os Testes Automatizados

```bash
cd web

# Testes unitários de métricas e compartilhamento (Vitest)
npm test

# Verificação estática de tipos TypeScript
npm run typecheck

# Lint de acessibilidade e código
npm run lint
```

---

## 🐳 Executando com Docker

A aplicação inclui um `Dockerfile` multi-stage com usuário não-root e `docker-compose.yml`:

```bash
# Construir e iniciar o container em segundo plano
docker compose up --build -d

# Visualizar logs
docker compose logs -f

# Parar o container
docker compose down
```

A aplicação ficará disponível em `http://localhost:3000`.

---

## 🔄 Reproduzindo o Pipeline de Dados (ETL)

Os dados pré-processados já acompanham o repositório em `web/public/data/`. Caso queira reconstruí-los a partir dos arquivos brutos das fontes governamentais:

```bash
# 1. Baixar bases oficiais do TSE e IBGE (cria data/raw/ e valida certificados)
python3 pipeline/01_fetch.py

# 2. Processar 18.858 zonas eleitorais e 5.570 municípios
python3 pipeline/02_build.py
```

O script `02_build.py` executa auditoria de integridade em 100% das zonas:
$$\sum \text{votos por candidato} = \text{votos válidos}$$
$$\text{votos válidos} + \text{brancos} + \text{nulos} = \text{comparecimento}$$
$$\text{comparecimento} + \text{abstenção} = \text{eleitores aptos}$$

---

## 📊 Fórmulas e Metodologia

1. **Percentual de Votos Válidos:**
   $$\%_{\text{válidos}} = \frac{\text{votos do candidato}}{\text{total de votos válidos}} \times 100$$

2. **Diferença (Margem Direta):**
   $$\text{Margem} = \text{votos Lula} - \text{votos Oponente}$$

3. **Votos Novos Necessários para Virada:**
   $$\text{Novos Votos} = (\text{votos Oponente} - \text{votos Lula}) + 1$$
   *(Provenientes de abstenções que passem a comparecer ou eleitores de outros candidatos/brancos/nulos)*

4. **Conversões Diretas (Trocas de Lado):**
   $$\text{Trocas} = \left\lfloor \frac{\text{votos Oponente} - \text{votos Lula}}{2} \right\rfloor + 1$$
   *(Cada eleitor convencido a trocar de lado reduz 1 voto do oponente e soma 1 voto a Lula, alterando o saldo em 2 votos)*

---

## 📜 Licença e Responsabilidade

Os dados utilizados são públicos sob a Lei de Acesso à Informação (Lei nº 12.527/2011). O código da plataforma está disponível para fins cívicos e democráticos. Recomenda-se a todos os usuários seguir rigorosamente as diretrizes éticas e a legislação do Tribunal Superior Eleitoral.
