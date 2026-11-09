# Contratos de APIs e Esquemas de Dados — VoVira

Este documento define os contratos de integração com APIs governamentais oficiais utilizados no pipeline de dados e os esquemas dos datasets estáticos consumidos pela interface web do VoVira.

---

## 1. APIs Governamentais Integradas (Pipeline Backend)

O pipeline em `pipeline/` executa rotinas periódicas de coleta e verificação de veracidade criptográfica (SHA-256) das proposições monitoradas.

### 1.1 Câmara dos Deputados (API Dados Abertos v2)

- **Finalidade:** Consulta de tramitação, despachos e ementas oficiais de Projetos de Lei (PL), PECs e MPs.
- **Rota:** `GET https://dadosabertos.camara.leg.br/api/v2/proposicoes/{id}`
- **Método:** `GET`
- **Headers:**
  - `Accept: application/json`
  - `User-Agent: VoVira-VeracidadeLegislativa/2.0 (+https://github.com/jvalb/VoVira)`
- **Parâmetros de Rota:**
  - `id` (inteiro): Identificador único da proposição no acervo da Câmara (ex.: `2487436`, `2233802`).
- **Respostas Esperadas:**
  - `200 OK`:
    ```json
    {
      "dados": {
        "id": 2487436,
        "uri": "https://dadosabertos.camara.leg.br/api/v2/proposicoes/2487436",
        "siglaTipo": "PL",
        "numero": 1087,
        "ano": 2025,
        "ementa": "Altera a legislação do Imposto sobre a Renda da Pessoa Física...",
        "statusProposicao": {
          "dataHora": "2025-11-26T18:00",
          "descricaoSituacao": "Transformado em Norma Jurídica",
          "descricaoTramitacao": "Autógrafo sancionado",
          "despacho": "Transformado na Lei Ordinária 15.270/2025"
        }
      }
    }
    ```
  - `404 Not Found`: Proposição não localizada no acervo.
  - `429 Too Many Requests`: Limite de taxa excedido (requer backoff exponencial).
  - `502 / 503 / 504`: Instabilidade temporária de upstream/gateway da Câmara. Tratado com retries e tolerância resiliente.

---

### 1.2 Senado Federal & Congresso Nacional (Dados Abertos)

- **Finalidade:** Consulta de processos bicamerais, normas sancionadas, emendas constitucionais e tramitação no Senado.
- **Rota:** `GET https://legis.senado.leg.br/dadosabertos/processo/{id}`
- **Método:** `GET`
- **Headers:**
  - `Accept: application/json`
  - `User-Agent: VoVira-VeracidadeLegislativa/2.0 (+https://github.com/jvalb/VoVira)`
- **Parâmetros de Rota:**
  - `id` (inteiro): Identificador numérico do processo legislativo no Senado Federal (ex.: `8926350`, `1396298`).
- **Respostas Esperadas:**
  - `200 OK`:
    ```json
    {
      "id": 8926350,
      "identificacao": "PL 1087/2025",
      "casaIdentificadora": "SF",
      "situacaoAtual": "Transformado em Norma Jurídica",
      "tramitando": "Não",
      "normaGerada": {
        "descricao": "Lei nº 15.270 de 26/11/2025"
      },
      "conteudo": {
        "ementa": "Isenção do IRPF até R$ 5.000 e tributação progressiva de altas rendas."
      }
    }
    ```
  - `404 Not Found`: Processo legislativo não encontrado.
  - `500 / 502 / 503 / 504`: Instabilidade temporária do serviço. Tratado com retries e tolerância resiliente.

---

### 1.3 Assembleias Legislativas Estaduais — Sistema SAPL / Interlegis

- **Finalidade:** Consulta de normas jurídicas estaduais sancionadas (PI, PB, AM, TO, AC).
- **Rota:** `GET https://sapl.al.{uf}.leg.br/api/norma/normajuridica/{id}/?format=json`
- **Método:** `GET`
- **Headers:**
  - `Accept: application/json`
  - `User-Agent: VoVira-VeracidadeLegislativa/2.0 (+https://github.com/jvalb/VoVira)`
- **Parâmetros de Rota:**
  - `uf` (string): Sigla do estado (ex.: `pi`, `pb`, `am`, `to`, `ac`).
  - `id` (inteiro): Identificador da norma jurídica no SAPL.
- **Respostas Esperadas:**
  - `200 OK`:
    ```json
    {
      "id": 7215,
      "__str__": "Lei nº 9.133, de 03 de novembro de 2026",
      "data": "2026-11-03",
      "ementa": "Institui o Programa Estadual de Aquisição de Alimentos da Agricultura Familiar..."
    }
    ```
  - `404 Not Found`: Norma não localizada no SAPL estadual.
  - `5xx / Timeout`: Servidor estadual indisponível. Tratado com retries e tolerância resiliente.

---

### 1.4 Assembleia Legislativa de Minas Gerais (ALMG)

- **Finalidade:** Consulta de projetos de lei em tramitação na ALMG.
- **Rota:** `GET https://dadosabertos.almg.gov.br/ws/proposicoes/{tipo}/{num}/{ano}?formato=json`
- **Método:** `GET`
- **Headers:**
  - `Accept: application/json`
- **Respostas Esperadas:**
  - `200 OK`:
    ```json
    {
      "resultado": {
        "listaItem": [
          {
            "id": 1450012,
            "situacao": "Aguardando designação de relator em comissão",
            "ementa": "Dispõe sobre o ICMS Solidário e distribuição de receitas tributárias."
          }
        ]
      }
    }
    ```

---

### 1.5 Banco Central do Brasil — Sistema Gerenciador de Séries Temporais (SGS)

- **Finalidade:** Obtenção do valor oficial e da data de vigência do Salário Mínimo nacional (Série SGS 1619).
- **Rota:** `GET https://api.bcb.gov.br/dados/serie/bcdata.sgs.1619/dados/ultimos/1?formato=json`
- **Método:** `GET`
- **Headers:**
  - `Accept: application/json`
- **Respostas Esperadas:**
  - `200 OK`:
    ```json
    [
      {
        "data": "01/12/2026",
        "valor": "1621.00"
      }
    ]
    ```

---

## 2. Contrato do Dataset Estático Consumido pelo Frontend

O frontend consome diretamente o arquivo estático gerado e auditado pelo pipeline:
- **Localização:** `web/public/data/propostas.json`

### 2.1 Estrutura do Documento JSON

```typescript
interface PropostasPayload {
  versao: string;                     // Versão do schema (ex.: "2.0")
  atualizadoEm: string;               // ISO 8601 UTC (ex.: "2026-11-09T22:13:00Z")
  descricao: string;                  // Descrição explicativa do dataset
  indicadoresOficiais: {
    salarioMinimoBCB?: {
      data: string;                   // Data de referência (ex.: "01/12/2026")
      valor: string;                  // Valor numérico em string (ex.: "1621.00")
    };
  };
  apisAgrupadas: Array<{
    id: string;
    nome: string;
    esfera: "Nacional" | "Estadual";
    endpointBase: string;
    docsUrl: string;
    descricao: string;
  }>;
  propostas: PropostaItem[];
}

interface PropostaItem {
  id: string;                         // Identificador textual canônico (slug)
  num: string;                        // Numeração de exibição (ex.: "01".."24")
  esfera: "nacional" | "estadual";    // Abrangência federativa
  uf: string;                         // UF de referência ("BR" ou sigla estadual)
  casaLegislativa: string;            // Casa do poder legislativo competente
  titulo: string;                     // Título legível da proposta
  eixo: string;                       // Eixo temático (ex.: "Economia e Trabalho", "Social e Saúde")
  status: "cumprida" | "andamento" | "nao_iniciada"; // Status consolidado
  progresso: number;                  // Percentual de 0 a 100
  regraAutomatica: "legislativa" | "hibrida" | "estadual_sapl" | "estadual_almg";
  progressoExecucao?: number;         // Percentual operacional (quando regra hibrida)
  overrideManual: boolean;            // Flag indicando trava manual de cálculo
  promessa: string;                   // Texto da promessa/diretriz original
  metaIndicador: string;              // Marco auditável verificável
  fonteAcompanhamento: string;        // Órgãos responsáveis pelo monitoramento
  camaraId?: number;                  // ID na API da Câmara dos Deputados
  senadoId?: number;                  // ID na API do Senado Federal
  apiEstadualUrl?: string;            // URL direta na API da Assembleia Estadual
  proposicaoCodigo?: string;          // Código legislativo oficial (ex.: "PL 1087/2025")
  urlFonte: string;                   // URL pública para consulta cidadã da tramitação
  urlSenado?: string;                 // URL pública no Senado
  situacaoCamara: string;             // Situação oficial extraída da API da Câmara/AL
  situacaoSenado?: string;            // Situação oficial extraída da API do Senado
  normaGerada?: string;               // Lei, Decreto ou Emenda Constitucional sancionada
  ultimaTramitacao: string;           // Último despacho ou estágio processual
  dataUltimaTramitacao?: string;      // Data no formato YYYY-MM-DD
  ementaOficial?: string;             // Ementa jurídica oficial extraída dos dados abertos
  sha256Verificacao: string;          // Hash SHA-256 criptográfico para garantia de veracidade
}
```

### 2.2 Regra de Verificação Criptográfica de Integridade

O campo `sha256Verificacao` de cada item em `propostas` é calculado pela concatenação dos campos canônicos separados por `|` em codificação UTF-8:
```python
campos = (
    "id",
    "esfera",
    "uf",
    "proposicaoCodigo",
    "camaraId",
    "senadoId",
    "apiEstadualUrl",
    "situacaoCamara",
    "situacaoSenado",
    "normaGerada",
    "ementaOficial",
)
chave = "|".join(str(p.get(k, "")) for k in campos)
hash_sha256 = hashlib.sha256(chave.encode("utf-8")).hexdigest()
```
Qualquer alteração nesses campos requer o recálculo do hash pelo agregador oficial. O validador `pipeline/04_verify_veracidade.py` confere 100% dos hashes contra adulterações antes do commit.
