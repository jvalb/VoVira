#!/usr/bin/env python3
"""
Pipeline 03 — Agregador Oficial Multi-Esfera (Nacional e Estadual) do Monitor de Propostas (VoVira).

APIs Oficiais Agrupadas:
1. Câmara dos Deputados (Federal):
   https://dadosabertos.camara.leg.br/api/v2/proposicoes/{camaraId}
2. Senado Federal & Congresso Nacional (Federal):
   https://legis.senado.leg.br/dadosabertos/processo/{senadoId}
   Documentação Swagger: https://legis.senado.leg.br/dadosabertos/api-docs/swagger-ui/index.html
3. Assembleias Legislativas Estaduais (Estadual — Rede SAPL/Interlegis e APIs Estaduais):
   - ALMG (Minas Gerais): https://dadosabertos.almg.gov.br/ws/proposicoes/...
   - ALEPI (Piauí):       https://sapl.al.pi.leg.br/api/norma/normajuridica/...
   - ALPB (Paraíba):      https://sapl.al.pb.leg.br/api/norma/normajuridica/...
   - ALEAM (Amazonas):    https://sapl.al.am.leg.br/api/norma/normajuridica/...
   - ALTO (Tocantins):    https://sapl.al.to.leg.br/api/norma/normajuridica/...
   - ALEAC (Acre):        https://sapl.al.ac.leg.br/api/norma/normajuridica/...
4. Banco Central do Brasil — SGS (Indicadores Macroeconômicos):
   https://api.bcb.gov.br/dados/serie/bcdata.sgs.1619/dados/ultimos/1?formato=json
"""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import pathlib
import sys
import urllib.error
import urllib.request
from typing import Any

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "pipeline"))
try:
    from http_util import fetch_json
except ImportError:
    from pipeline.http_util import fetch_json

PROPOSTAS_PATH = ROOT / "web" / "public" / "data" / "propostas.json"

CAMARA_API = "https://dadosabertos.camara.leg.br/api/v2/proposicoes"
SENADO_API = "https://legis.senado.leg.br/dadosabertos/processo"
BCB_SM_API = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.1619/dados/ultimos/1?formato=json"

HEADERS = {
    "Accept": "application/json",
    "User-Agent": "VoVira-VeracidadeLegislativa/2.0 (+https://github.com/jvalb/VoVira)",
}

APIS_AGRUPADAS = [
    {
        "id": "senado-congresso",
        "nome": "Senado Federal & Congresso Nacional",
        "esfera": "Nacional",
        "endpointBase": "https://legis.senado.leg.br/dadosabertos/processo",
        "docsUrl": "https://legis.senado.leg.br/dadosabertos/api-docs/swagger-ui/index.html",
        "descricao": "Processos legislativos bicamerais, Medidas Provisórias do Congresso Nacional, PECs e Normas Jurídicas sancionadas.",
    },
    {
        "id": "camara-federal",
        "nome": "Câmara dos Deputados",
        "esfera": "Nacional",
        "endpointBase": "https://dadosabertos.camara.leg.br/api/v2/proposicoes",
        "docsUrl": "https://dadosabertos.camara.leg.br/swagger/api.html",
        "descricao": "Tramitação em tempo real de Projetos de Lei (PL), Projetos de Lei Complementar (PLP) e PECs na Câmara Federal.",
    },
    {
        "id": "assembleias-estaduais",
        "nome": "Assembleias Legislativas Estaduais (SAPL/Interlegis & ALMG)",
        "esfera": "Estadual",
        "endpointBase": "https://sapl.al.{uf}.leg.br/api/norma/normajuridica/ | https://dadosabertos.almg.gov.br/ws/",
        "docsUrl": "https://www12.senado.leg.br/interlegis/produtos/sapl",
        "descricao": "Leis ordinárias, leis complementares e proposições estaduais nas Assembleias Legislativas (PI, PB, AM, TO, MG, AC).",
    },
    {
        "id": "bcb-sgs",
        "nome": "Banco Central do Brasil (SGS)",
        "esfera": "Nacional",
        "endpointBase": "https://api.bcb.gov.br/dados/serie/bcdata.sgs.1619/dados",
        "docsUrl": "https://dadosabertos.bcb.gov.br/",
        "descricao": "Série histórica oficial do Salário Mínimo vigente e indicadores econômicos federais.",
    },
]


def PROPOSTAS_SEMENTE() -> list[dict[str, Any]]:
    return [
        # ==================== ESCALA NACIONAL (16 PROPOSTAS BICAMERAIS) ====================
        {
            "id": "ir-5mil",
            "num": "01",
            "esfera": "nacional",
            "uf": "BR",
            "casaLegislativa": "Câmara dos Deputados & Senado Federal",
            "titulo": "Isenção de Imposto de Renda até R$ 5 mil e taxação de super-ricos",
            "eixo": "Economia e Trabalho",
            "status": "cumprida",
            "progresso": 100,
            "regraAutomatica": "legislativa",
            "overrideManual": False,
            "promessa": "Isentar trabalhadoras e trabalhadores que ganham até R$ 5.000 mensais e compensar com alíquota mínima sobre rendas milionárias, dividendos e offshores.",
            "metaIndicador": "Faixa de isenção efetiva até R$ 5.000/mês sancionada (Lei nº 15.270/2025) + tributação de fundos exclusivos e altas rendas.",
            "fonteAcompanhamento": "Câmara dos Deputados / Senado Federal / Ministério da Fazenda",
            "camaraId": 2487436,
            "senadoId": 8926350,
            "proposicaoCodigo": "PL 1087/2025",
            "urlFonte": "https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2487436",
            "urlSenado": "https://legis.senado.leg.br/dadosabertos/processo/8926350",
            "situacaoCamara": "Transformado em Norma Jurídica",
            "situacaoSenado": "Transformado na Lei nº 15.270 de 26/11/2025",
            "normaGerada": "Lei nº 15.270 de 26/11/2025",
            "ultimaTramitacao": "Autógrafo sancionado pela Presidência da República (Lei nº 15.270/2025).",
            "dataUltimaTramitacao": "2025-12-01",
        },
        {
            "id": "salario-minimo",
            "num": "02",
            "esfera": "nacional",
            "uf": "BR",
            "casaLegislativa": "Congresso Nacional (Câmara & Senado)",
            "titulo": "Política permanente de valorização real do Salário Mínimo",
            "eixo": "Economia e Trabalho",
            "status": "cumprida",
            "progresso": 100,
            "regraAutomatica": "legislativa",
            "overrideManual": False,
            "promessa": "Garantir em lei o reajuste anual do salário mínimo acima da inflação (INPC + crescimento do PIB de dois anos antes), recuperando o poder de compra popular.",
            "metaIndicador": "Lei nº 14.663/2023 sancionada e aplicada nos orçamentos anuais consecutivos (R$ 1.621 vigentes no SGS/BCB).",
            "fonteAcompanhamento": "Congresso Nacional / BCB (SGS 1619) / MTE",
            "camaraId": 2359135,
            "senadoId": 8438758,
            "proposicaoCodigo": "MPV 1172/2023",
            "urlFonte": "https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2359135",
            "urlSenado": "https://legis.senado.leg.br/dadosabertos/processo/8438758",
            "situacaoCamara": "Transformado em Norma Jurídica",
            "situacaoSenado": "Transformado na Lei nº 14.663 de 28/08/2023",
            "normaGerada": "Lei nº 14.663 de 28/08/2023",
            "ultimaTramitacao": "Política permanente de valorização real do Salário Mínimo em vigor.",
            "dataUltimaTramitacao": "2023-10-31",
        },
        {
            "id": "escala-6x1",
            "num": "03",
            "esfera": "nacional",
            "uf": "BR",
            "casaLegislativa": "Câmara dos Deputados & Senado Federal",
            "titulo": "Redução da jornada de trabalho e fim da escala 6x1 sem corte salarial",
            "eixo": "Economia e Trabalho",
            "status": "andamento",
            "progresso": 75,
            "regraAutomatica": "hibrida",
            "progressoExecucao": 75,
            "overrideManual": False,
            "promessa": "Avançar na redução da jornada semanal máxima e na superação da escala 6x1, garantindo tempo de vida, descanso e qualificação para a classe trabalhadora.",
            "metaIndicador": "EC 141/2026 aprovada a partir da PEC 221/2019 (c/ PEC 8/2025) na Câmara e PEC 148/2015 em tramitação complementar no Senado.",
            "fonteAcompanhamento": "Câmara dos Deputados / Senado Federal / Ministério do Trabalho",
            "camaraId": 2233802,
            "senadoId": 1396298,
            "proposicaoCodigo": "PEC 221/2019 · PEC 8/2025 · PEC 148/2015",
            "urlFonte": "https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2233802",
            "urlSenado": "https://legis.senado.leg.br/dadosabertos/processo/1396298",
            "situacaoCamara": "Transformado em Norma Jurídica",
            "situacaoSenado": "Em tramitação no Senado Federal (PEC 148/2015)",
            "normaGerada": "Emenda Constitucional nº 141/2026",
            "ultimaTramitacao": "Transformado na Emenda Constitucional 141/2026; regulamentação setorial em andamento.",
            "dataUltimaTramitacao": "2026-10-16",
        },
        {
            "id": "mapa-da-fome",
            "num": "04",
            "esfera": "nacional",
            "uf": "BR",
            "casaLegislativa": "Congresso Nacional (Câmara & Senado)",
            "titulo": "Brasil fora do Mapa da Fome e Bolsa Família com adicional por criança",
            "eixo": "Social e Saúde",
            "status": "cumprida",
            "progresso": 95,
            "regraAutomatica": "hibrida",
            "progressoExecucao": 95,
            "overrideManual": False,
            "promessa": "Retirar novamente o Brasil do Mapa da Fome da ONU, mantendo o piso de R$ 600 no Bolsa Família mais R$ 150 por criança de até 6 anos e R$ 50 para gestantes e jovens.",
            "metaIndicador": "Lei nº 14.601/2023 em vigor e queda de 85% na insegurança alimentar grave (IBGE/PNAD e relatório SOFI/FAO).",
            "fonteAcompanhamento": "Congresso Nacional / MDS / IBGE / FAO-ONU",
            "camaraId": 2349947,
            "senadoId": 8376035,
            "proposicaoCodigo": "MPV 1164/2023",
            "urlFonte": "https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2349947",
            "urlSenado": "https://legis.senado.leg.br/dadosabertos/processo/8376035",
            "situacaoCamara": "Transformado em Norma Jurídica",
            "situacaoSenado": "Transformado na Lei nº 14.601 de 19/06/2023",
            "normaGerada": "Lei nº 14.601 de 19/06/2023",
            "ultimaTramitacao": "Novo Programa Bolsa Família consolidado em lei federal.",
            "dataUltimaTramitacao": "2023-08-22",
        },
        {
            "id": "especialistas-sus",
            "num": "05",
            "esfera": "nacional",
            "uf": "BR",
            "casaLegislativa": "Congresso Nacional (Câmara & Senado)",
            "titulo": "Mais Acesso a Especialistas no SUS e expansão do Mais Médicos",
            "eixo": "Social e Saúde",
            "status": "andamento",
            "progresso": 70,
            "regraAutomatica": "hibrida",
            "progressoExecucao": 70,
            "overrideManual": False,
            "promessa": "Zerar filas históricas de exames, cirurgias eletivas e consultas especializadas no SUS com pacotes integrados (OCI) e dobrar a cobertura do Mais Médicos nas periferias.",
            "metaIndicador": "Lei nº 14.621/2023 sancionada; mais de 28 mil médicos em atuação e rede nacional de exames integrados em expansão.",
            "fonteAcompanhamento": "Congresso Nacional / Ministério da Saúde / DataSUS",
            "camaraId": 2351990,
            "senadoId": 8391815,
            "proposicaoCodigo": "MPV 1165/2023",
            "urlFonte": "https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2351990",
            "urlSenado": "https://legis.senado.leg.br/dadosabertos/processo/8391815",
            "situacaoCamara": "Transformado em Norma Jurídica",
            "situacaoSenado": "Transformado na Lei nº 14.621 de 14/07/2023",
            "normaGerada": "Lei nº 14.621 de 14/07/2023",
            "ultimaTramitacao": "Estratégia Nacional de Formação de Especialistas para a Saúde sancionada.",
            "dataUltimaTramitacao": "2023-09-12",
        },
        {
            "id": "minha-casa",
            "num": "06",
            "esfera": "nacional",
            "uf": "BR",
            "casaLegislativa": "Congresso Nacional (Câmara & Senado)",
            "titulo": "Minha Casa, Minha Vida: 2 milhões de novas moradias contratadas",
            "eixo": "Social e Saúde",
            "status": "andamento",
            "progresso": 80,
            "regraAutomatica": "hibrida",
            "progressoExecucao": 80,
            "overrideManual": False,
            "promessa": "Retomar a Faixa 1 para famílias de baixa renda, incluir isenção de prestações para beneficiários do Bolsa Família/BPC e atingir 2 milhões de moradias contratadas.",
            "metaIndicador": "Lei nº 14.620/2023 em vigor e mais de 1,6 milhão de unidades contratadas com foco na Faixa 1.",
            "fonteAcompanhamento": "Congresso Nacional / Ministério das Cidades / Caixa",
            "camaraId": 2348811,
            "senadoId": 8369106,
            "proposicaoCodigo": "MPV 1162/2023",
            "urlFonte": "https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2348811",
            "urlSenado": "https://legis.senado.leg.br/dadosabertos/processo/8369106",
            "situacaoCamara": "Transformado em Norma Jurídica",
            "situacaoSenado": "Transformado na Lei nº 14.620 de 13/07/2023",
            "normaGerada": "Lei nº 14.620 de 13/07/2023",
            "ultimaTramitacao": "Marco legal do novo Minha Casa, Minha Vida sancionado.",
            "dataUltimaTramitacao": "2023-09-12",
        },
        {
            "id": "pe-de-meia",
            "num": "07",
            "esfera": "nacional",
            "uf": "BR",
            "casaLegislativa": "Câmara dos Deputados & Senado Federal",
            "titulo": "Programa Pé-de-Meia universalizado e 100 novos Institutos Federais",
            "eixo": "Educação e Ciência",
            "status": "cumprida",
            "progresso": 90,
            "regraAutomatica": "hibrida",
            "progressoExecucao": 90,
            "overrideManual": False,
            "promessa": "Combater a evasão no ensino médio público com poupança estudantil mensal e expandir a rede federal de educação profissional e tecnológica em todas as regiões.",
            "metaIndicador": "Leis nº 14.818/2024 e nº 14.992/2024 sancionadas; quase 4 milhões de alunos atendidos e 100 novos IFs contratados.",
            "fonteAcompanhamento": "Câmara dos Deputados / Senado Federal / MEC / FNDE",
            "camaraId": 2408709,
            "senadoId": 8663409,
            "proposicaoCodigo": "PL 5813/2023",
            "urlFonte": "https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2408709",
            "urlSenado": "https://legis.senado.leg.br/dadosabertos/processo/8663409",
            "situacaoCamara": "Transformado em Norma Jurídica",
            "situacaoSenado": "Transformado na Lei nº 14.992 de 03/10/2024",
            "normaGerada": "Lei nº 14.992 de 03/10/2024",
            "ultimaTramitacao": "Expansão do Pé-de-Meia e incentivo estudantil sancionados.",
            "dataUltimaTramitacao": "2024-10-29",
        },
        {
            "id": "reajuste-ciencia",
            "num": "08",
            "esfera": "nacional",
            "uf": "BR",
            "casaLegislativa": "Câmara dos Deputados & Senado Federal",
            "titulo": "Recomposição integral do FNDCT, bolsas de pesquisa e universidades",
            "eixo": "Educação e Ciência",
            "status": "cumprida",
            "progresso": 100,
            "regraAutomatica": "legislativa",
            "overrideManual": False,
            "promessa": "Reajustar bolsas da CAPES e CNPq após anos de congelamento, desbloquear 100% do Fundo Nacional de Desenvolvimento Científico e Tecnológico e retomar obras em universidades.",
            "metaIndicador": "LC 177/2021 aplicada integralmente, bolsas reajustadas em até 75% e FNDCT sem contingenciamento.",
            "fonteAcompanhamento": "Senado Federal / Câmara dos Deputados / MCTI / CAPES / CNPq",
            "camaraId": 2262099,
            "senadoId": 7918784,
            "proposicaoCodigo": "PLP 135/2020",
            "urlFonte": "https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2262099",
            "urlSenado": "https://legis.senado.leg.br/dadosabertos/processo/7918784",
            "situacaoCamara": "Transformado em Norma Jurídica",
            "situacaoSenado": "Transformado na Lei Complementar nº 177 de 12/01/2021",
            "normaGerada": "Lei Complementar nº 177 de 12/01/2021",
            "ultimaTramitacao": "Vedação ao contingenciamento do FNDCT em vigor.",
            "dataUltimaTramitacao": "2021-04-07",
        },
        {
            "id": "desmatamento-zero",
            "num": "09",
            "esfera": "nacional",
            "uf": "BR",
            "casaLegislativa": "Congresso Nacional (Câmara & Senado)",
            "titulo": "Rumo ao Desmatamento Zero na Amazônia até 2030 e retomada das demarcações",
            "eixo": "Clima e Amazônia",
            "status": "andamento",
            "progresso": 75,
            "regraAutomatica": "hibrida",
            "progressoExecucao": 75,
            "overrideManual": False,
            "promessa": "Reduzir drasticamente o desmatamento ilegal na Amazônia e no Cerrado, fortalecer o IBAMA/ICMBio, reativar o Fundo Amazônia e homologar Terras Indígenas.",
            "metaIndicador": "Lei nº 14.600/2023 em vigor; queda acumulada superior a 45% no desmatamento da Amazônia (PRODES/INPE) e novas TIs homologadas.",
            "fonteAcompanhamento": "Congresso Nacional / MMA / INPE / Ministério dos Povos Indígenas",
            "camaraId": 2345493,
            "senadoId": 8349431,
            "proposicaoCodigo": "MPV 1154/2023",
            "urlFonte": "https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2345493",
            "urlSenado": "https://legis.senado.leg.br/dadosabertos/processo/8349431",
            "situacaoCamara": "Transformado em Norma Jurídica",
            "situacaoSenado": "Transformado na Lei nº 14.600 de 19/06/2023",
            "normaGerada": "Lei nº 14.600 de 19/06/2023",
            "ultimaTramitacao": "Governança ambiental do MMA e Ministério dos Povos Indígenas consolidada em lei.",
            "dataUltimaTramitacao": "2024-05-21",
        },
        {
            "id": "transicao-ecologica",
            "num": "10",
            "esfera": "nacional",
            "uf": "BR",
            "casaLegislativa": "Câmara dos Deputados & Senado Federal",
            "titulo": "Plano de Transformação Ecológica e Mercado Regulado de Carbono",
            "eixo": "Clima e Amazônia",
            "status": "andamento",
            "progresso": 65,
            "regraAutomatica": "hibrida",
            "progressoExecucao": 65,
            "overrideManual": False,
            "promessa": "Impulsionar o programa Nova Indústria Brasil (NIB) com mercado regulado de carbono, hidrogênio verde, mobilidade elétrica pública e bioeconomia amazônica.",
            "metaIndicador": "Lei nº 15.042/2024 (Mercado Brasileiro de Redução de Emissões - SBCE) sancionada e linhas BNDES Mais Inovação ativas.",
            "fonteAcompanhamento": "Câmara dos Deputados / Senado Federal / MDIC / Fazenda",
            "camaraId": 1548579,
            "senadoId": 8617321,
            "proposicaoCodigo": "PL 182/2024",
            "urlFonte": "https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=1548579",
            "urlSenado": "https://legis.senado.leg.br/dadosabertos/processo/8617321",
            "situacaoCamara": "Transformado em Norma Jurídica",
            "situacaoSenado": "Transformado na Lei nº 15.042 de 11/12/2024",
            "normaGerada": "Lei nº 15.042 de 11/12/2024",
            "ultimaTramitacao": "Sistema Brasileiro de Comércio de Emissões de Gases de Efeito Estufa sancionado.",
            "dataUltimaTramitacao": "2024-12-17",
        },
        {
            "id": "cesta-basica-zero",
            "num": "11",
            "esfera": "nacional",
            "uf": "BR",
            "casaLegislativa": "Câmara dos Deputados & Senado Federal",
            "titulo": "Reforma Tributária com Cesta Básica Nacional isenta (alíquota zero) e Cashback",
            "eixo": "Democracia e Soberania",
            "status": "cumprida",
            "progresso": 95,
            "regraAutomatica": "hibrida",
            "progressoExecucao": 95,
            "overrideManual": False,
            "promessa": "Regulamentar o IVA dual com imposto zero para os alimentos da Cesta Básica Nacional e devolução de tributos (cashback) na conta de luz, gás e água para famílias de baixa renda.",
            "metaIndicador": "EC 132 promulgada e Lei Complementar nº 214/2025 (cashback popular e cesta básica isenta) sancionada.",
            "fonteAcompanhamento": "Câmara dos Deputados / Senado Federal / Ministério da Fazenda",
            "camaraId": 2430143,
            "senadoId": 8701679,
            "proposicaoCodigo": "PLP 68/2024",
            "urlFonte": "https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2430143",
            "urlSenado": "https://legis.senado.leg.br/dadosabertos/processo/8701679",
            "situacaoCamara": "Transformado em Norma Jurídica",
            "situacaoSenado": "Transformado na Lei Complementar nº 214 de 16/01/2025",
            "normaGerada": "Lei Complementar nº 214 de 16/01/2025",
            "ultimaTramitacao": "Regulamentação da Reforma Tributária com Cesta Básica isenta e Cashback promulgada.",
            "dataUltimaTramitacao": "2025-07-07",
        },
        {
            "id": "soberania-digital",
            "num": "12",
            "esfera": "nacional",
            "uf": "BR",
            "casaLegislativa": "Senado Federal & Câmara dos Deputados",
            "titulo": "Regulação democrática das plataformas digitais, IA soberana e direitos de entregadores",
            "eixo": "Democracia e Soberania",
            "status": "nao_iniciada",
            "progresso": 35,
            "regraAutomatica": "legislativa",
            "overrideManual": False,
            "promessa": "Responsabilizar grandes plataformas digitais contra ataques à democracia, desenvolver infraestrutura pública de IA (Plano Brasileiro de IA) e garantir direitos previdenciários a trabalhadores de aplicativos.",
            "metaIndicador": "Marco Legal da IA (PL 2338/2023) aprovado no Senado e em análise na Câmara; PLP 12/2024 em articulação.",
            "fonteAcompanhamento": "Senado Federal / Câmara dos Deputados / MCTI / Secom",
            "camaraId": 2487262,
            "senadoId": 8441243,
            "proposicaoCodigo": "PL 2338/2023 · PLP 12/2024",
            "urlFonte": "https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2487262",
            "urlSenado": "https://legis.senado.leg.br/dadosabertos/processo/8441243",
            "situacaoCamara": "Aguardando Parecer",
            "situacaoSenado": "Remetida à Câmara dos Deputados após aprovação no Senado",
            "normaGerada": "",
            "ultimaTramitacao": "Aguardando Parecer na Comissão Especial sobre Inteligência Artificial da Câmara.",
            "dataUltimaTramitacao": "2026-10-27",
        },
        {
            "id": "igualdade-salarial",
            "num": "13",
            "esfera": "nacional",
            "uf": "BR",
            "casaLegislativa": "Câmara dos Deputados & Senado Federal",
            "titulo": "Lei da Igualdade Salarial e de Critérios Remuneratórios entre Mulheres e Homens",
            "eixo": "Economia e Trabalho",
            "status": "cumprida",
            "progresso": 100,
            "regraAutomatica": "legislativa",
            "overrideManual": False,
            "promessa": "Tornar obrigatória a transparência salarial nas empresas com 100 ou mais empregados e aplicar multas rigorosas contra discriminação salarial de gênero e raça.",
            "metaIndicador": "Lei nº 14.611/2023 sancionada e relatórios semestrais de transparência salarial em execução pelo MTE.",
            "fonteAcompanhamento": "Câmara dos Deputados / Senado Federal / Ministério das Mulheres / MTE",
            "camaraId": 2351179,
            "senadoId": 8447680,
            "proposicaoCodigo": "PL 1085/2023",
            "urlFonte": "https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2351179",
            "urlSenado": "https://legis.senado.leg.br/dadosabertos/processo/8447680",
            "situacaoCamara": "Transformado em Norma Jurídica",
            "situacaoSenado": "Transformado na Lei nº 14.611 de 03/07/2023",
            "normaGerada": "Lei nº 14.611 de 03/07/2023",
            "ultimaTramitacao": "Igualdade salarial entre mulheres e homens sancionada (Lei nº 14.611/2023).",
            "dataUltimaTramitacao": "2023-07-03",
        },
        {
            "id": "desenrola-brasil",
            "num": "14",
            "esfera": "nacional",
            "uf": "BR",
            "casaLegislativa": "Câmara dos Deputados & Senado Federal",
            "titulo": "Programa Desenrola Brasil e teto aos juros do rotativo do cartão de crédito",
            "eixo": "Economia e Trabalho",
            "status": "cumprida",
            "progresso": 100,
            "regraAutomatica": "legislativa",
            "overrideManual": False,
            "promessa": "Renegociar dívidas bancárias e de contas básicas de milhões de famílias negativadas e limitar em 100% os juros abusivos do crédito rotativo.",
            "metaIndicador": "Lei nº 14.690/2023 sancionada; mais de 15 milhões de pessoas beneficiadas na renegociação de dívidas.",
            "fonteAcompanhamento": "Câmara dos Deputados / Senado Federal / Ministério da Fazenda",
            "camaraId": 2336393,
            "senadoId": 8536851,
            "proposicaoCodigo": "PL 2685/2022",
            "urlFonte": "https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2336393",
            "urlSenado": "https://legis.senado.leg.br/dadosabertos/processo/8536851",
            "situacaoCamara": "Transformado em Norma Jurídica",
            "situacaoSenado": "Transformado na Lei nº 14.690 de 03/10/2023",
            "normaGerada": "Lei nº 14.690 de 03/10/2023",
            "ultimaTramitacao": "Programa Desenrola Brasil e limite de juros do rotativo sancionados.",
            "dataUltimaTramitacao": "2023-10-03",
        },
        {
            "id": "combustivel-do-futuro",
            "num": "15",
            "esfera": "nacional",
            "uf": "BR",
            "casaLegislativa": "Câmara dos Deputados & Senado Federal",
            "titulo": "Programa Combustível do Futuro, Diesel Verde e Descarbonização da Frota",
            "eixo": "Clima e Amazônia",
            "status": "cumprida",
            "progresso": 95,
            "regraAutomatica": "hibrida",
            "progressoExecucao": 95,
            "overrideManual": False,
            "promessa": "Instituir mandatos crescentes para combustível sustentável de aviação (SAF), diesel verde, biometano e captura geológica de carbono.",
            "metaIndicador": "Lei nº 14.993/2024 sancionada pelo Presidente Lula com metas obrigatórias de descarbonização.",
            "fonteAcompanhamento": "Câmara dos Deputados / Senado Federal / MME",
            "camaraId": 2238434,
            "senadoId": 8636556,
            "proposicaoCodigo": "PL 528/2020",
            "urlFonte": "https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2238434",
            "urlSenado": "https://legis.senado.leg.br/dadosabertos/processo/8636556",
            "situacaoCamara": "Transformado em Norma Jurídica",
            "situacaoSenado": "Transformado na Lei nº 14.993 de 08/10/2024",
            "normaGerada": "Lei nº 14.993 de 08/10/2024",
            "ultimaTramitacao": "Marco do Combustível do Futuro sancionado (Lei nº 14.993/2024).",
            "dataUltimaTramitacao": "2024-10-08",
        },
        {
            "id": "ensino-integral",
            "num": "16",
            "esfera": "nacional",
            "uf": "BR",
            "casaLegislativa": "Câmara dos Deputados & Senado Federal",
            "titulo": "Programa Escola em Tempo Integral com 1 milhão de novas matrículas",
            "eixo": "Educação e Ciência",
            "status": "cumprida",
            "progresso": 100,
            "regraAutomatica": "legislativa",
            "overrideManual": False,
            "promessa": "Fomentar financeiramente estados e municípios para ampliar em 1 milhão as matrículas de jornada integral na educação básica pública.",
            "metaIndicador": "Lei nº 14.640/2023 sancionada e meta de 1 milhão de matrículas pactuada com 100% das UFs.",
            "fonteAcompanhamento": "Câmara dos Deputados / Senado Federal / MEC / FNDE",
            "camaraId": 2362716,
            "senadoId": 8491851,
            "proposicaoCodigo": "PL 2617/2023",
            "urlFonte": "https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2362716",
            "urlSenado": "https://legis.senado.leg.br/dadosabertos/processo/8491851",
            "situacaoCamara": "Transformado em Norma Jurídica",
            "situacaoSenado": "Transformado na Lei nº 14.640 de 31/07/2023",
            "normaGerada": "Lei nº 14.640 de 31/07/2023",
            "ultimaTramitacao": "Programa Escola em Tempo Integral instituído pela Lei nº 14.640/2023.",
            "dataUltimaTramitacao": "2023-07-31",
        },

        # ==================== ESCALA ESTADUAL (8 PROPOSTAS/LEIS NAS ASSEMBLEIAS LEGISLATIVAS) ====================
        {
            "id": "est-pi-alimentacao",
            "num": "17",
            "esfera": "estadual",
            "uf": "PI",
            "casaLegislativa": "Assembleia Legislativa do Piauí (ALEPI)",
            "titulo": "Alimentação Saudável e Exclusão de Ultraprocessados nas Escolas (Piauí)",
            "eixo": "Social e Saúde",
            "status": "cumprida",
            "progresso": 100,
            "regraAutomatica": "estadual_sapl",
            "overrideManual": False,
            "promessa": "Alinhar a política estadual de segurança alimentar ao combate à fome, garantindo refeições saudáveis e proibindo alimentos ultraprocessados nas escolas.",
            "metaIndicador": "Lei Estadual nº 9.133/2026 sancionada e publicada pela Assembleia Legislativa do Piauí (ALEPI).",
            "fonteAcompanhamento": "API Dados Abertos ALEPI (SAPL/Interlegis) · Norma #7215",
            "proposicaoCodigo": "Lei Estadual nº 9.133/2026 (PI)",
            "apiEstadualUrl": "https://sapl.al.pi.leg.br/api/norma/normajuridica/7215/?format=json",
            "urlFonte": "https://sapl.al.pi.leg.br/norma/7215",
            "situacaoCamara": "Norma Jurídica Estadual Vigente (ALEPI)",
            "normaGerada": "Lei nº 9.133, de 03 de novembro de 2026",
            "ultimaTramitacao": "Dispõe sobre a promoção da alimentação adequada e saudável e a exclusão de alimentos ultraprocessados.",
            "dataUltimaTramitacao": "2026-11-03",
        },
        {
            "id": "est-pb-autonomia-escolar",
            "num": "18",
            "esfera": "estadual",
            "uf": "PB",
            "casaLegislativa": "Assembleia Legislativa da Paraíba (ALPB)",
            "titulo": "Programa de Autonomia Financeira das Regionais de Ensino — PAFIR (Paraíba)",
            "eixo": "Educação e Ciência",
            "status": "cumprida",
            "progresso": 100,
            "regraAutomatica": "estadual_sapl",
            "overrideManual": False,
            "promessa": "Descentralizar recursos pedagógicos e administrativos diretamente para as gerências regionais de educação, fortalecendo o ensino público estadual.",
            "metaIndicador": "Lei Ordinária Estadual nº 14.745/2026 aprovada na ALPB e em execução na rede estadual.",
            "fonteAcompanhamento": "API Dados Abertos ALPB (SAPL/Interlegis) · Norma #19235",
            "proposicaoCodigo": "Lei Estadual nº 14.745/2026 (PB)",
            "apiEstadualUrl": "https://sapl.al.pb.leg.br/api/norma/normajuridica/19235/?format=json",
            "urlFonte": "https://sapl.al.pb.leg.br/norma/19235",
            "situacaoCamara": "Norma Jurídica Estadual Vigente (ALPB)",
            "normaGerada": "Lei Ordinária nº 14.745, de 30 de outubro de 2026",
            "ultimaTramitacao": "Institui o Programa de Autonomia Financeira das Regionais – PAFIR/PB e dispõe sobre a descentralização de recursos.",
            "dataUltimaTramitacao": "2026-10-30",
        },
        {
            "id": "est-pb-ipva-social",
            "num": "19",
            "esfera": "estadual",
            "uf": "PB",
            "casaLegislativa": "Assembleia Legislativa da Paraíba (ALPB)",
            "titulo": "Justiça Tributária Estadual no IPVA para Trabalhadores e Transporte (Paraíba)",
            "eixo": "Economia e Trabalho",
            "status": "cumprida",
            "progresso": 100,
            "regraAutomatica": "estadual_sapl",
            "overrideManual": False,
            "promessa": "Atualizar a legislação estadual do IPVA para ampliar isenções sociais e proteger trabalhadores que dependem de veículos leves e motocicletas.",
            "metaIndicador": "Lei Ordinária Estadual nº 14.747/2026 promulgada na Assembleia Legislativa da Paraíba.",
            "fonteAcompanhamento": "API Dados Abertos ALPB (SAPL/Interlegis) · Norma #19242",
            "proposicaoCodigo": "Lei Estadual nº 14.747/2026 (PB)",
            "apiEstadualUrl": "https://sapl.al.pb.leg.br/api/norma/normajuridica/19242/?format=json",
            "urlFonte": "https://sapl.al.pb.leg.br/norma/19242",
            "situacaoCamara": "Norma Jurídica Estadual Vigente (ALPB)",
            "normaGerada": "Lei Ordinária nº 14.747, de 03 de novembro de 2026",
            "ultimaTramitacao": "Altera a Lei nº 11.007/2017, que dispõe sobre o Imposto sobre a Propriedade de Veículos Automotores (IPVA).",
            "dataUltimaTramitacao": "2026-11-03",
        },
        {
            "id": "est-am-saude-mulher",
            "num": "20",
            "esfera": "estadual",
            "uf": "AM",
            "casaLegislativa": "Assembleia Legislativa do Amazonas (ALEAM)",
            "titulo": "Atenção Integral à Saúde da Mulher na Rede Pública Estadual (Amazonas)",
            "eixo": "Social e Saúde",
            "status": "cumprida",
            "progresso": 100,
            "regraAutomatica": "estadual_sapl",
            "overrideManual": False,
            "promessa": "Garantir atendimento multiprofissional, medicamentos e acompanhamento especializado à saúde da mulher nas unidades do SUS no Amazonas.",
            "metaIndicador": "Lei Ordinária Estadual nº 8.544/2026 aprovada na ALEAM e integrada à rede estadual de saúde.",
            "fonteAcompanhamento": "API Dados Abertos ALEAM (SAPL/Interlegis) · Norma #15178",
            "proposicaoCodigo": "Lei Estadual nº 8.544/2026 (AM)",
            "apiEstadualUrl": "https://sapl.al.am.leg.br/api/norma/normajuridica/15178/?format=json",
            "urlFonte": "https://sapl.al.am.leg.br/norma/15178",
            "situacaoCamara": "Norma Jurídica Estadual Vigente (ALEAM)",
            "normaGerada": "Lei Ordinária nº 8.544, de 28 de setembro de 2026",
            "ultimaTramitacao": "Dispõe sobre incentivos à promoção da saúde da mulher no climatério e na menopausa no Estado do Amazonas.",
            "dataUltimaTramitacao": "2026-09-28",
        },
        {
            "id": "est-am-servidores-saude",
            "num": "21",
            "esfera": "estadual",
            "uf": "AM",
            "casaLegislativa": "Assembleia Legislativa do Amazonas (ALEAM)",
            "titulo": "Valorização Salarial dos Trabalhadores do Sistema Estadual de Saúde (Amazonas)",
            "eixo": "Economia e Trabalho",
            "status": "cumprida",
            "progresso": 100,
            "regraAutomatica": "estadual_sapl",
            "overrideManual": False,
            "promessa": "Recompor a remuneração dos servidores públicos estaduais da saúde que atuam na linha de frente do SUS na Amazônia.",
            "metaIndicador": "Lei Ordinária Estadual nº 8.542/2026 sancionada e publicada no Amazonas.",
            "fonteAcompanhamento": "API Dados Abertos ALEAM (SAPL/Interlegis) · Norma #15176",
            "proposicaoCodigo": "Lei Estadual nº 8.542/2026 (AM)",
            "apiEstadualUrl": "https://sapl.al.am.leg.br/api/norma/normajuridica/15176/?format=json",
            "urlFonte": "https://sapl.al.am.leg.br/norma/15176",
            "situacaoCamara": "Norma Jurídica Estadual Vigente (ALEAM)",
            "normaGerada": "Lei Ordinária nº 8.542, de 28 de setembro de 2026",
            "ultimaTramitacao": "Altera a remuneração dos servidores públicos do Sistema Estadual de Saúde do Amazonas.",
            "dataUltimaTramitacao": "2026-09-28",
        },
        {
            "id": "est-to-oncologia-infantil",
            "num": "22",
            "esfera": "estadual",
            "uf": "TO",
            "casaLegislativa": "Assembleia Legislativa do Tocantins (ALTO)",
            "titulo": "Programa Estadual de Apoio à Oncologia Infantil e Doenças Graves (Tocantins)",
            "eixo": "Social e Saúde",
            "status": "cumprida",
            "progresso": 100,
            "regraAutomatica": "estadual_sapl",
            "overrideManual": False,
            "promessa": "Articular o programa federal Mais Acesso a Especialistas com rede estadual dedicada ao diagnóstico precoce e tratamento oncológico pediátrico.",
            "metaIndicador": "Lei Ordinária Estadual nº 5.095/2026 aprovada na Assembleia Legislativa do Tocantins (ALTO).",
            "fonteAcompanhamento": "API Dados Abertos ALTO (SAPL/Interlegis) · Norma #1572",
            "proposicaoCodigo": "Lei Estadual nº 5.095/2026 (TO)",
            "apiEstadualUrl": "https://sapl.al.to.leg.br/api/norma/normajuridica/1572/?format=json",
            "urlFonte": "https://sapl.al.to.leg.br/norma/1572",
            "situacaoCamara": "Norma Jurídica Estadual Vigente (ALTO)",
            "normaGerada": "Lei Ordinária-ALTO nº 5.095, de 27 de julho de 2026",
            "ultimaTramitacao": "Dispõe sobre instituição do Programa Estadual de Apoio à Oncologia Infantil e Enfermidades Graves Correlatas.",
            "dataUltimaTramitacao": "2026-07-27",
        },
        {
            "id": "est-mg-icms-social",
            "num": "23",
            "esfera": "estadual",
            "uf": "MG",
            "casaLegislativa": "Assembleia Legislativa de Minas Gerais (ALMG)",
            "titulo": "Redistribuição Solidária da Cota-Parte do ICMS aos Municípios (Minas Gerais)",
            "eixo": "Democracia e Soberania",
            "status": "andamento",
            "progresso": 55,
            "regraAutomatica": "estadual_almg",
            "overrideManual": False,
            "promessa": "Aprimorar os critérios de distribuição da parcela do ICMS pertencente aos municípios mineiros para fortalecer cidades com maior vulnerabilidade social.",
            "metaIndicador": "PL 1500/2023 em tramitação nas comissões temáticas da Assembleia Legislativa de Minas Gerais (ALMG).",
            "fonteAcompanhamento": "API Dados Abertos ALMG · Proposição PL 1500/2023",
            "proposicaoCodigo": "PL Estadual 1500/2023 (MG)",
            "apiEstadualUrl": "https://dadosabertos.almg.gov.br/ws/proposicoes/PL/1500/2023?formato=json",
            "urlFonte": "https://www.almg.gov.br/atividade-parlamentar/projetos-de-lei/projeto/?tipo=PL&num=1500&ano=2023",
            "situacaoCamara": "Em tramitação nas Comissões (ALMG)",
            "normaGerada": "",
            "ultimaTramitacao": "Altera a Lei 18.030/2009, que dispõe sobre a distribuição da parcela da receita do produto da arrecadação do ICMS.",
            "dataUltimaTramitacao": "2024-06-15",
        },
        {
            "id": "est-ac-carreira-publica",
            "num": "24",
            "esfera": "estadual",
            "uf": "AC",
            "casaLegislativa": "Assembleia Legislativa do Acre (ALEAC)",
            "titulo": "Plano de Carreira, Cargos e Remuneração dos Servidores Públicos (Acre)",
            "eixo": "Economia e Trabalho",
            "status": "cumprida",
            "progresso": 100,
            "regraAutomatica": "estadual_sapl",
            "overrideManual": False,
            "promessa": "Estruturar a carreira e garantir progressão funcional digna para os servidores públicos estaduais na Região Norte.",
            "metaIndicador": "Lei Complementar Estadual nº 84 consolidada na Assembleia Legislativa do Estado do Acre (ALEAC).",
            "fonteAcompanhamento": "API Dados Abertos ALEAC (SAPL/Interlegis) · Norma #1671",
            "proposicaoCodigo": "Lei Complementar Estadual nº 84 (AC)",
            "apiEstadualUrl": "https://sapl.al.ac.leg.br/api/norma/normajuridica/1671/?format=json",
            "urlFonte": "https://sapl.al.ac.leg.br/norma/1671",
            "situacaoCamara": "Norma Jurídica Estadual Vigente (ALEAC)",
            "normaGerada": "Lei Complementar nº 84 (ALEAC)",
            "ultimaTramitacao": "Institui o Plano de Carreira, Cargos e Remuneração para os Servidores Públicos Estaduais.",
            "dataUltimaTramitacao": "2023-01-01",
        },
    ]


def calcular_hash_verificacao(obj: dict[str, Any]) -> str:
    """Gera hash SHA-256 determinístico dos campos de evidência oficial da proposta."""
    chave = "|".join(
        str(obj.get(k, ""))
        for k in (
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
    )
    return hashlib.sha256(chave.encode("utf-8")).hexdigest()


def carregar_dados() -> dict[str, Any]:
    semente = PROPOSTAS_SEMENTE()
    if PROPOSTAS_PATH.exists():
        with open(PROPOSTAS_PATH, "r", encoding="utf-8") as f:
            atual = json.load(f)
        existentes_por_id = {p["id"]: p for p in atual.get("propostas", [])}
        combinadas = []
        for s in semente:
            if s["id"] in existentes_por_id:
                ex = existentes_por_id[s["id"]]
                merged = {**s, **ex}
                # Preserva os metadados novos da semente (senadoId, esfera, uf, casaLegislativa, apiEstadualUrl)
                for campo_novo in ("esfera", "uf", "casaLegislativa", "senadoId", "urlSenado", "apiEstadualUrl", "num"):
                    if campo_novo in s:
                        merged[campo_novo] = s[campo_novo]
                combinadas.append(merged)
            else:
                combinadas.append(s)
        atual["apisAgrupadas"] = APIS_AGRUPADAS
        atual["propostas"] = combinadas
        return atual

    return {
        "atualizadoEm": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "metodoAtualizacao": "Multi-esfera (Câmara Federal + Senado/Congresso + Assembleias Estaduais SAPL/ALMG + BCB SGS)",
        "apisAgrupadas": APIS_AGRUPADAS,
        "indicadoresOficiais": {},
        "propostas": semente,
    }


def salvar_dados(dados: dict[str, Any]) -> None:
    PROPOSTAS_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(PROPOSTAS_PATH, "w", encoding="utf-8") as f:
        json.dump(dados, f, ensure_ascii=False, indent=2)
        f.write("\n")


def inferir_status_legislativo(
    situacao: str,
    regra: str,
    progresso_execucao: int | None,
    norma_gerada: str = "",
) -> tuple[str, int]:
    sit_lower = f"{situacao or ''} {norma_gerada or ''}".lower()
    norma_juridica = any(
        k in sit_lower for k in ("norma jurídica", "lei nº", "lei ordinária", "lei complementar", "emenda constitucional", "promulgad", "sancionad")
    )

    if regra in ("legislativa", "estadual_sapl"):
        if norma_juridica:
            return "cumprida", 100
        if any(k in sit_lower for k in ("pronta para pauta", "plenário", "senado", "comissão")):
            return "andamento", 55
        if any(k in sit_lower for k in ("aguardando parecer", "tramitando", "apensação")):
            return "nao_iniciada", 35
        return "nao_iniciada", 25

    if regra == "estadual_almg":
        if norma_juridica:
            return "cumprida", 100
        return "andamento", progresso_execucao or 55

    prog = progresso_execucao if progresso_execucao is not None else (90 if norma_juridica else 50)
    if prog >= 90 and norma_juridica:
        return "cumprida", prog
    if prog >= 40 or norma_juridica:
        return "andamento", prog
    return "nao_iniciada", prog


def consultar_camara(camara_id: int) -> dict[str, str] | None:
    url = f"{CAMARA_API}/{camara_id}"
    payload = fetch_json(url, headers=HEADERS, timeout=15, retries=3, backoff_factor=1.0)
    if not payload or not isinstance(payload, dict):
        return None
    try:
        dados = payload.get("dados", {})
        st = dados.get("statusProposicao", {}) or {}
        situacao = st.get("descricaoSituacao") or st.get("descricaoTramitacao") or "Em tramitação"
        despacho = (st.get("despacho") or st.get("descricaoTramitacao") or "").strip()
        if len(despacho) > 160:
            despacho = despacho[:157].rstrip() + "..."
        data_hora = (st.get("dataHora") or "")[:10]
        ementa = (dados.get("ementa") or "").strip()
        return {
            "situacaoCamara": situacao,
            "ultimaTramitacao": despacho or situacao,
            "dataUltimaTramitacao": data_hora,
            "ementaOficial": ementa,
        }
    except Exception as exc:
        print(f"  [aviso] Falha ao processar dados da Câmara ID {camara_id}: {exc}", file=sys.stderr)
        return None


def consultar_senado(senado_id: int) -> dict[str, str] | None:
    url = f"{SENADO_API}/{senado_id}"
    payload = fetch_json(url, headers=HEADERS, timeout=15, retries=3, backoff_factor=1.0)
    if not payload or not isinstance(payload, dict):
        return None
    try:
        d = payload
        norma_raw = d.get("normaGerada")
        if isinstance(norma_raw, dict):
            norma = str(norma_raw.get("descricao") or "").strip()
        else:
            norma = str(norma_raw or "").strip()
        ident = str(d.get("identificacao") or "").strip()
        casa = str(d.get("casaIdentificadora") or "SF").strip()
        situacao_atual = str(d.get("situacaoAtual") or "").strip()
        tramitando = str(d.get("tramitando") or "")
        if norma:
            situacao_senado = f"Sancionada / Promulgada: {norma}"
        elif situacao_atual:
            situacao_senado = f"{situacao_atual} ({casa})"
        elif tramitando == "Sim":
            situacao_senado = f"Em tramitação ({casa})"
        else:
            situacao_senado = f"Processo {ident} ({casa})"
        conteudo = d.get("conteudo")
        ementa = str(conteudo.get("ementa") if isinstance(conteudo, dict) else d.get("ementa") or "").strip()
        return {
            "situacaoSenado": situacao_senado,
            "normaGerada": norma,
            "casaSenado": casa,
            "ementaSenado": ementa,
        }
    except Exception as exc:
        print(f"  [aviso] Falha ao processar dados do Senado ID {senado_id}: {exc}", file=sys.stderr)
        return None


def consultar_api_estadual(url: str, regra: str) -> dict[str, str] | None:
    payload = fetch_json(url, headers=HEADERS, timeout=15, retries=3, backoff_factor=1.0)
    if not payload or not isinstance(payload, dict):
        return None
    try:
        d = payload
        if regra == "estadual_almg" or "resultado" in d:
            lista = d.get("resultado", {}).get("listaItem", [])
            if not lista:
                return None
            item = lista[0]
            ementa = " ".join((item.get("ementa") or "").split())
            sit = (item.get("situacao") or "Em tramitação na ALMG").strip()
            return {
                "situacaoCamara": f"{sit} (ALMG)",
                "ultimaTramitacao": ementa[:160],
                "ementaOficial": ementa,
                "normaGerada": "",
            }
        # Padrão SAPL / Interlegis (ALEPI, ALPB, ALEAM, ALTO, ALEAC)
        norma_str = (d.get("__str__") or "").strip()
        ementa = " ".join((d.get("ementa") or "").split())
        data_pub = (d.get("data") or "")[:10]
        return {
            "situacaoCamara": "Norma Jurídica Estadual Vigente",
            "ultimaTramitacao": ementa[:160] if ementa else norma_str,
            "dataUltimaTramitacao": data_pub,
            "ementaOficial": ementa,
            "normaGerada": norma_str,
        }
    except Exception as exc:
        print(f"  [aviso] Falha ao processar dados da API Estadual ({url}): {exc}", file=sys.stderr)
        return None


def consultar_salario_minimo_bcb() -> dict[str, str] | None:
    arr = fetch_json(BCB_SM_API, headers=HEADERS, timeout=15, retries=3, backoff_factor=1.0)
    if arr and isinstance(arr, list):
        try:
            ultimo = arr[-1]
            return {"data": ultimo.get("data", ""), "valor": ultimo.get("valor", "")}
        except Exception as exc:
            print(f"  [aviso] Falha ao formatar registro do BCB SGS 1619: {exc}", file=sys.stderr)
    return None


def sincronizar_automaticamente(dados: dict[str, Any], forcar: bool = False) -> int:
    alteracoes = 0
    print("Iniciando varredura multi-esfera (Câmara Federal + Senado/Congresso + Assembleias Estaduais + BCB)...")

    sm = consultar_salario_minimo_bcb()
    if sm:
        anterior_sm = dados.get("indicadoresOficiais", {}).get("salarioMinimoBCB")
        if anterior_sm != sm:
            dados.setdefault("indicadoresOficiais", {})["salarioMinimoBCB"] = sm
            alteracoes += 1
        print(f"  [BCB SGS 1619] Salário mínimo vigente consultado: R$ {sm['valor']} (ref. {sm['data']})")

    for p in dados.get("propostas", []):
        antes_hash = p.get("sha256Verificacao")
        antes_estado = (
            p.get("situacaoCamara"),
            p.get("situacaoSenado"),
            p.get("normaGerada"),
            p.get("ultimaTramitacao"),
            p.get("status"),
            p.get("progresso"),
            p.get("ementaOficial"),
        )

        if p.get("esfera") == "estadual" and p.get("apiEstadualUrl"):
            info_est = consultar_api_estadual(p["apiEstadualUrl"], p.get("regraAutomatica", "estadual_sapl"))
            if info_est:
                p["situacaoCamara"] = info_est["situacaoCamara"]
                p["ultimaTramitacao"] = info_est["ultimaTramitacao"]
                if info_est.get("dataUltimaTramitacao"):
                    p["dataUltimaTramitacao"] = info_est["dataUltimaTramitacao"]
                if info_est.get("ementaOficial"):
                    p["ementaOficial"] = info_est["ementaOficial"]
                if info_est.get("normaGerada"):
                    p["normaGerada"] = info_est["normaGerada"]
        else:
            camara_id = p.get("camaraId")
            if camara_id:
                info_c = consultar_camara(int(camara_id))
                if info_c:
                    p["situacaoCamara"] = info_c["situacaoCamara"]
                    p["ultimaTramitacao"] = info_c["ultimaTramitacao"]
                    if info_c["dataUltimaTramitacao"]:
                        p["dataUltimaTramitacao"] = info_c["dataUltimaTramitacao"]
                    if info_c.get("ementaOficial"):
                        p["ementaOficial"] = info_c["ementaOficial"]

            senado_id = p.get("senadoId")
            if senado_id:
                info_s = consultar_senado(int(senado_id))
                if info_s:
                    p["situacaoSenado"] = info_s["situacaoSenado"]
                    if info_s.get("normaGerada"):
                        p["normaGerada"] = info_s["normaGerada"]
                    if not p.get("ementaOficial") and info_s.get("ementaSenado"):
                        p["ementaOficial"] = info_s["ementaSenado"]

        if not p.get("overrideManual", False):
            novo_status, novo_prog = inferir_status_legislativo(
                p.get("situacaoCamara", ""),
                p.get("regraAutomatica", "hibrida"),
                p.get("progressoExecucao"),
                p.get("normaGerada", ""),
            )
            p["status"] = novo_status
            p["progresso"] = novo_prog

        p["sha256Verificacao"] = calcular_hash_verificacao(p)

        depois_estado = (
            p.get("situacaoCamara"),
            p.get("situacaoSenado"),
            p.get("normaGerada"),
            p.get("ultimaTramitacao"),
            p.get("status"),
            p.get("progresso"),
            p.get("ementaOficial"),
        )
        if antes_estado != depois_estado or antes_hash != p["sha256Verificacao"]:
            alteracoes += 1

        esfera_tag = f"{p.get('esfera', 'nacional').upper()}:{p.get('uf', 'BR')}"
        print(
            f"  [{p['num']}] ({esfera_tag}) {p['id']} -> "
            f"status={p['status']} ({p['progresso']}%) | sha256={p['sha256Verificacao'][:12]}..."
        )

    if alteracoes > 0 or forcar or not PROPOSTAS_PATH.exists():
        dados["atualizadoEm"] = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        salvar_dados(dados)
        print(f"Sincronização concluída ({alteracoes} propostas atualizadas em {PROPOSTAS_PATH}).")
    else:
        print("Sincronização concluída: nenhuma alteração detectada nas fontes oficiais.")
    return alteracoes


def atualizar_manual(
    dados: dict[str, Any],
    prop_id: str,
    status: str | None,
    progresso: int | None,
    marco: str | None,
    destravar_auto: bool,
) -> None:
    alvo = next((p for p in dados.get("propostas", []) if p["id"] == prop_id or p["num"] == prop_id), None)
    if not alvo:
        ids_validos = ", ".join(f"{p['id']} ({p['num']})" for p in dados.get("propostas", []))
        raise SystemExit(f"Erro: proposta '{prop_id}' não encontrada. IDs válidos: {ids_validos}")

    if destravar_auto:
        alvo["overrideManual"] = False
    else:
        alvo["overrideManual"] = True

    if status is not None:
        alvo["status"] = status
    if progresso is not None:
        if not (0 <= progresso <= 100):
            raise SystemExit("Erro: --progresso deve estar entre 0 e 100.")
        alvo["progresso"] = progresso
        if alvo.get("regraAutomatica") == "hibrida":
            alvo["progressoExecucao"] = progresso
    if marco is not None:
        alvo["metaIndicador"] = marco

    alvo["sha256Verificacao"] = calcular_hash_verificacao(alvo)
    dados["atualizadoEm"] = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    salvar_dados(dados)
    print(
        f"Proposta [{alvo['num']}] '{alvo['id']}' atualizada internamente com sucesso:\n"
        f"  status={alvo['status']} | progresso={alvo['progresso']}% | overrideManual={alvo['overrideManual']}\n"
        f"  marco={alvo['metaIndicador']}"
    )


def listar_propostas(dados: dict[str, Any]) -> None:
    print(f"Última atualização: {dados.get('atualizadoEm', 'N/D')}")
    print("-" * 110)
    for p in dados.get("propostas", []):
        esfera = f"{p.get('esfera', 'nacional').upper()}:{p.get('uf', 'BR')}"
        print(
            f"[{p['num']}] {esfera:<12} | {p['id']:<24} | {p['status']:<12} | {p['progresso']:>3}% | "
            f"{p.get('proposicaoCodigo', '')} ({p.get('normaGerada') or p.get('situacaoCamara', '')})"
        )


def main() -> None:
    parser = argparse.ArgumentParser(description="Agregador Multi-Esfera (Nacional e Estadual) de Propostas do VoVira.")
    parser.add_argument("--auto", action="store_true", help="Sincroniza com Câmara, Senado/Congresso, Assembleias Estaduais e BCB.")
    parser.add_argument("--force", action="store_true", help="Força gravação mesmo sem alterações.")
    parser.add_argument("--list", action="store_true", help="Lista todas as propostas nacionais e estaduais.")
    parser.add_argument("--id", help="ID ou número (01..24) da proposta para atualização manual interna.")
    parser.add_argument(
        "--status",
        choices=["cumprida", "andamento", "nao_iniciada"],
        help="Define manualmente o status da proposta.",
    )
    parser.add_argument("--progresso", type=int, help="Define manualmente o percentual de execução (0 a 100).")
    parser.add_argument("--marco", help="Atualiza o texto do marco verificável (metaIndicador).")
    parser.add_argument(
        "--unlock-auto",
        action="store_true",
        help="Remove a trava manual (overrideManual=False) para voltar ao cálculo automático.",
    )

    args = parser.parse_args()
    dados = carregar_dados()

    if args.list:
        listar_propostas(dados)
        return

    if args.id:
        atualizar_manual(dados, args.id, args.status, args.progresso, args.marco, args.unlock_auto)
        return

    sincronizar_automaticamente(dados, forcar=args.force)


if __name__ == "__main__":
    main()
