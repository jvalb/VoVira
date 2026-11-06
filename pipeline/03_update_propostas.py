#!/usr/bin/env python3
"""
Pipeline 03 — Atualização Automática e Manual Interna do Monitor de Propostas (VoVira).

Fontes oficiais consultadas automaticamente:
1. API de Dados Abertos da Câmara dos Deputados:
   https://dadosabertos.camara.leg.br/api/v2/proposicoes/{camaraId}
2. API do Sistema Gerenciador de Séries Temporais (SGS) do Banco Central do Brasil:
   https://api.bcb.gov.br/dados/serie/bcdata.sgs.1619/dados/ultimos/1?formato=json

Modos de uso:
- Varredura automática nas APIs oficiais:
    python3 pipeline/03_update_propostas.py --auto
- Atualização manual interna de uma proposta:
    python3 pipeline/03_update_propostas.py --id escala-6x1 --status andamento --progresso 65 --marco "EC 141/2026 promulgada; regulamentação setorial em curso"
- Listar estado atual:
    python3 pipeline/03_update_propostas.py --list
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import pathlib
import sys
import urllib.error
import urllib.request
from typing import Any

ROOT = pathlib.Path(__file__).resolve().parent.parent
PROPOSTAS_PATH = ROOT / "web" / "public" / "data" / "propostas.json"

CAMARA_API = "https://dadosabertos.camara.leg.br/api/v2/proposicoes"
BCB_SM_API = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.1619/dados/ultimos/1?formato=json"

HEADERS = {
    "Accept": "application/json",
    "User-Agent": "VoVira-MonitorPropostas/1.0 (+https://github.com/jvalb/VoVira)",
}


def PROPOSTAS_SEMENTE() -> list[dict[str, Any]]:
    return [
        {
            "id": "ir-5mil",
            "num": "01",
            "titulo": "Isenção de Imposto de Renda até R$ 5 mil e taxação de super-ricos",
            "eixo": "Economia e Trabalho",
            "status": "cumprida",
            "progresso": 100,
            "regraAutomatica": "legislativa",
            "overrideManual": False,
            "promessa": "Isentar trabalhadoras e trabalhadores que ganham até R$ 5.000 mensais e compensar com alíquota mínima sobre rendas milionárias, dividendos e offshores.",
            "metaIndicador": "Faixa de isenção efetiva até R$ 5.000/mês + tributação de fundos exclusivos/offshores sancionada.",
            "fonteAcompanhamento": "Ministério da Fazenda / Receita Federal / Câmara dos Deputados",
            "camaraId": 2487436,
            "proposicaoCodigo": "PL 1087/2025",
            "urlFonte": "https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2487436",
            "situacaoCamara": "Transformado em Norma Jurídica",
            "ultimaTramitacao": "Autógrafo sancionado pela Presidência da República.",
            "dataUltimaTramitacao": "2025-12-01",
        },
        {
            "id": "salario-minimo",
            "num": "02",
            "titulo": "Política permanente de valorização real do Salário Mínimo",
            "eixo": "Economia e Trabalho",
            "status": "cumprida",
            "progresso": 100,
            "regraAutomatica": "legislativa",
            "overrideManual": False,
            "promessa": "Garantir em lei o reajuste anual do salário mínimo acima da inflação (INPC + crescimento do PIB de dois anos antes), recuperando o poder de compra popular.",
            "metaIndicador": "Lei nº 14.663 sancionada e aplicada nos orçamentos anuais consecutivos.",
            "fonteAcompanhamento": "Ministério do Trabalho e Emprego / BCB / Câmara dos Deputados",
            "camaraId": 2359135,
            "proposicaoCodigo": "MPV 1172/2023 (Lei 14.663/2023)",
            "urlFonte": "https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2359135",
            "situacaoCamara": "Transformado em Norma Jurídica",
            "ultimaTramitacao": "Transformado na Lei Ordinária nº 14.663/2023.",
            "dataUltimaTramitacao": "2023-10-31",
        },
        {
            "id": "escala-6x1",
            "num": "03",
            "titulo": "Redução da jornada de trabalho e fim da escala 6x1 sem corte salarial",
            "eixo": "Economia e Trabalho",
            "status": "andamento",
            "progresso": 75,
            "regraAutomatica": "hibrida",
            "progressoExecucao": 75,
            "overrideManual": False,
            "promessa": "Avançar na redução da jornada semanal máxima e na superação da escala 6x1, garantindo tempo de vida, descanso e qualificação para a classe trabalhadora.",
            "metaIndicador": "EC 141/2026 promulgada (redução constitucional gradual para 36h) e regulamentação setorial contra a escala 6x1 em curso.",
            "fonteAcompanhamento": "Câmara dos Deputados / Ministério do Trabalho",
            "camaraId": 2233802,
            "proposicaoCodigo": "PEC 221/2019 e PEC 8/2025 (EC 141/2026)",
            "urlFonte": "https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2233802",
            "situacaoCamara": "Transformado em Norma Jurídica",
            "ultimaTramitacao": "Transformado na Emenda Constitucional 141/2026 (DOU 16/10/2026).",
            "dataUltimaTramitacao": "2026-10-16",
        },
        {
            "id": "mapa-da-fome",
            "num": "04",
            "titulo": "Brasil fora do Mapa da Fome e Bolsa Família com adicional por criança",
            "eixo": "Social e Saúde",
            "status": "cumprida",
            "progresso": 95,
            "regraAutomatica": "hibrida",
            "progressoExecucao": 95,
            "overrideManual": False,
            "promessa": "Retirar novamente o Brasil do Mapa da Fome da ONU, mantendo o piso de R$ 600 no Bolsa Família mais R$ 150 por criança de até 6 anos e R$ 50 para gestantes e jovens.",
            "metaIndicador": "Queda de 85% na insegurança alimentar grave (IBGE/PNAD e relatório SOFI/FAO).",
            "fonteAcompanhamento": "MDS / IBGE / FAO-ONU / Câmara dos Deputados",
            "camaraId": 2349947,
            "proposicaoCodigo": "MPV 1164/2023 (Lei 14.601/2023)",
            "urlFonte": "https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2349947",
            "situacaoCamara": "Transformado em Norma Jurídica",
            "ultimaTramitacao": "Transformado na Lei Ordinária nº 14.601/2023 (Novo Bolsa Família).",
            "dataUltimaTramitacao": "2023-08-22",
        },
        {
            "id": "especialistas-sus",
            "num": "05",
            "titulo": "Mais Acesso a Especialistas no SUS e expansão do Mais Médicos",
            "eixo": "Social e Saúde",
            "status": "andamento",
            "progresso": 70,
            "regraAutomatica": "hibrida",
            "progressoExecucao": 70,
            "overrideManual": False,
            "promessa": "Zerar filas históricas de exames, cirurgias eletivas e consultas especializadas no SUS com pacotes integrados (OCI) e dobrar a cobertura do Mais Médicos nas periferias.",
            "metaIndicador": "Mais de 28 mil médicos em atuação e rede nacional de exames integrados em implantação.",
            "fonteAcompanhamento": "Ministério da Saúde / DataSUS / Câmara dos Deputados",
            "camaraId": 2351990,
            "proposicaoCodigo": "MPV 1165/2023 (Lei 14.621/2023)",
            "urlFonte": "https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2351990",
            "situacaoCamara": "Transformado em Norma Jurídica",
            "ultimaTramitacao": "Estratégia Nacional de Formação de Especialistas sancionada (Lei 14.621/2023).",
            "dataUltimaTramitacao": "2023-09-12",
        },
        {
            "id": "minha-casa",
            "num": "06",
            "titulo": "Minha Casa, Minha Vida: 2 milhões de novas moradias contratadas",
            "eixo": "Social e Saúde",
            "status": "andamento",
            "progresso": 80,
            "regraAutomatica": "hibrida",
            "progressoExecucao": 80,
            "overrideManual": False,
            "promessa": "Retomar a Faixa 1 para famílias de baixa renda, incluir isenção de prestações para beneficiários do Bolsa Família/BPC e atingir 2 milhões de moradias contratadas.",
            "metaIndicador": "Mais de 1,6 milhão de unidades contratadas com foco na Faixa 1 e requalificação urbana.",
            "fonteAcompanhamento": "Ministério das Cidades / Caixa / Câmara dos Deputados",
            "camaraId": 2348811,
            "proposicaoCodigo": "MPV 1162/2023 (Lei 14.620/2023)",
            "urlFonte": "https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2348811",
            "situacaoCamara": "Transformado em Norma Jurídica",
            "ultimaTramitacao": "Marco legal do novo Minha Casa, Minha Vida sancionado (Lei 14.620/2023).",
            "dataUltimaTramitacao": "2023-09-12",
        },
        {
            "id": "pe-de-meia",
            "num": "07",
            "titulo": "Programa Pé-de-Meia universalizado e 100 novos Institutos Federais",
            "eixo": "Educação e Ciência",
            "status": "cumprida",
            "progresso": 90,
            "regraAutomatica": "hibrida",
            "progressoExecucao": 90,
            "overrideManual": False,
            "promessa": "Combater a evasão no ensino médio público com poupança estudantil mensal e expandir a rede federal de educação profissional e tecnológica em todas as regiões.",
            "metaIndicador": "Quase 4 milhões de estudantes no Pé-de-Meia e obras dos 100 novos campi de IFs contratadas.",
            "fonteAcompanhamento": "Ministério da Educação (MEC) / FNDE / Câmara dos Deputados",
            "camaraId": 2408709,
            "proposicaoCodigo": "PL 5813/2023 (Lei 14.818/2024)",
            "urlFonte": "https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2408709",
            "situacaoCamara": "Transformado em Norma Jurídica",
            "ultimaTramitacao": "Poupança de incentivo à permanência escolar sancionada (Lei 14.818/2024).",
            "dataUltimaTramitacao": "2024-10-29",
        },
        {
            "id": "reajuste-ciencia",
            "num": "08",
            "titulo": "Recomposição integral do FNDCT, bolsas de pesquisa e universidades",
            "eixo": "Educação e Ciência",
            "status": "cumprida",
            "progresso": 100,
            "regraAutomatica": "legislativa",
            "overrideManual": False,
            "promessa": "Reajustar bolsas da CAPES e CNPq após anos de congelamento, desbloquear 100% do Fundo Nacional de Desenvolvimento Científico e Tecnológico e retomar obras em universidades.",
            "metaIndicador": "Bolsas reajustadas em até 75% e FNDCT operando em sua totalidade sem contingenciamento.",
            "fonteAcompanhamento": "MCTI / CAPES / CNPq / Câmara dos Deputados",
            "camaraId": 2262099,
            "proposicaoCodigo": "PLP 135/2020 (LC 177/2021 + Decreto 11.456/2023)",
            "urlFonte": "https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2262099",
            "situacaoCamara": "Transformado em Norma Jurídica",
            "ultimaTramitacao": "Desbloqueio integral do FNDCT e reajuste de bolsas consolidados.",
            "dataUltimaTramitacao": "2023-03-01",
        },
        {
            "id": "desmatamento-zero",
            "num": "09",
            "titulo": "Rumo ao Desmatamento Zero na Amazônia até 2030 e retomada das demarcações",
            "eixo": "Clima e Amazônia",
            "status": "andamento",
            "progresso": 75,
            "regraAutomatica": "hibrida",
            "progressoExecucao": 75,
            "overrideManual": False,
            "promessa": "Reduzir drasticamente o desmatamento ilegal na Amazônia e no Cerrado, fortalecer o IBAMA/ICMBio, reativar o Fundo Amazônia e homologar Terras Indígenas.",
            "metaIndicador": "Queda acumulada superior a 45% no desmatamento da Amazônia (PRODES/INPE) e novas TIs homologadas.",
            "fonteAcompanhamento": "MMA / INPE / Ministério dos Povos Indígenas",
            "camaraId": 2345493,
            "proposicaoCodigo": "MPV 1154/2023 (Lei 14.600/2023)",
            "urlFonte": "https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2345493",
            "situacaoCamara": "Transformado em Norma Jurídica",
            "ultimaTramitacao": "Estrutura climática do MMA, MPI e Fundo Amazônia consolidada em lei.",
            "dataUltimaTramitacao": "2024-05-21",
        },
        {
            "id": "transicao-ecologica",
            "num": "10",
            "titulo": "Plano de Transformação Ecológica e Neoindustrialização Verde",
            "eixo": "Clima e Amazônia",
            "status": "andamento",
            "progresso": 65,
            "regraAutomatica": "hibrida",
            "progressoExecucao": 65,
            "overrideManual": False,
            "promessa": "Impulsionar o programa Nova Indústria Brasil (NIB) com mercado regulado de carbono, hidrogênio verde, mobilidade elétrica pública e bioeconomia amazônica.",
            "metaIndicador": "Marco do mercado de carbono aprovado (Lei 15.042/2024) e linhas do BNDES Mais Inovação em operação.",
            "fonteAcompanhamento": "MDIC / BNDES / Ministério da Fazenda / Câmara dos Deputados",
            "camaraId": 1548579,
            "proposicaoCodigo": "PL 182/2024 (Lei 15.042/2024)",
            "urlFonte": "https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=1548579",
            "situacaoCamara": "Transformado em Norma Jurídica",
            "ultimaTramitacao": "Sistema Brasileiro de Comércio de Emissões (SBCE) sancionado.",
            "dataUltimaTramitacao": "2024-12-17",
        },
        {
            "id": "cesta-basica-zero",
            "num": "11",
            "titulo": "Reforma Tributária com Cesta Básica Nacional isenta (alíquota zero) e Cashback",
            "eixo": "Democracia e Soberania",
            "status": "cumprida",
            "progresso": 95,
            "regraAutomatica": "hibrida",
            "progressoExecucao": 95,
            "overrideManual": False,
            "promessa": "Regulamentar o IVA dual com imposto zero para os alimentos da Cesta Básica Nacional e devolução de tributos (cashback) na conta de luz, gás e água para famílias de baixa renda.",
            "metaIndicador": "Emenda Constitucional 132 promulgada e Lei Complementar 214/2025 (cashback e cesta básica) sancionada.",
            "fonteAcompanhamento": "Congresso Nacional / Ministério da Fazenda",
            "camaraId": 2430143,
            "proposicaoCodigo": "PLP 68/2024 (LC 214/2025)",
            "urlFonte": "https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2430143",
            "situacaoCamara": "Transformado em Norma Jurídica",
            "ultimaTramitacao": "Regulamentação da Cesta Básica Nacional isenta e Cashback promulgada.",
            "dataUltimaTramitacao": "2025-07-07",
        },
        {
            "id": "soberania-digital",
            "num": "12",
            "titulo": "Regulação democrática das plataformas digitais, IA soberana e direitos de entregadores",
            "eixo": "Democracia e Soberania",
            "status": "nao_iniciada",
            "progresso": 35,
            "regraAutomatica": "legislativa",
            "overrideManual": False,
            "promessa": "Responsabilizar grandes plataformas digitais contra ataques à democracia, desenvolver infraestrutura pública de IA (Plano Brasileiro de IA) e garantir direitos previdenciários a trabalhadores de aplicativos.",
            "metaIndicador": "PBIA lançado; regulação das big techs e Marco Legal da IA (PL 2338/2023) em tramitação na Câmara.",
            "fonteAcompanhamento": "Secom / MCTI / Câmara dos Deputados",
            "camaraId": 2487262,
            "proposicaoCodigo": "PL 2338/2023 e PLP 12/2024",
            "urlFonte": "https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2487262",
            "situacaoCamara": "Aguardando Parecer",
            "ultimaTramitacao": "Aguardando Parecer na Comissão Especial sobre Inteligência Artificial.",
            "dataUltimaTramitacao": "2026-10-27",
        },
    ]


def carregar_dados() -> dict[str, Any]:
    if PROPOSTAS_PATH.exists():
        with open(PROPOSTAS_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {
        "atualizadoEm": dt.datetime.now(dt.timezone.utc).isoformat(),
        "metodoAtualizacao": "hibrido (API Dados Abertos da Câmara + BCB SGS + curadoria interna)",
        "indicadoresOficiais": {},
        "propostas": PROPOSTAS_SEMENTE(),
    }


def salvar_dados(dados: dict[str, Any]) -> None:
    PROPOSTAS_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(PROPOSTAS_PATH, "w", encoding="utf-8") as f:
        json.dump(dados, f, ensure_ascii=False, indent=2)
        f.write("\n")


def inferir_status_legislativo(situacao: str, regra: str, progresso_execucao: int | None) -> tuple[str, int]:
    sit_lower = (situacao or "").lower()
    norma_juridica = "norma jurídica" in sit_lower or "promulgad" in sit_lower or "sancionad" in sit_lower

    if regra == "legislativa":
        if norma_juridica:
            return "cumprida", 100
        if any(k in sit_lower for k in ("pronta para pauta", "plenário", "apreciação pelo senado", "comissão")):
            return "andamento", 55
        if any(k in sit_lower for k in ("aguardando parecer", "tramitando", "apensação")):
            return "nao_iniciada", 35
        return "nao_iniciada", 25

    # Regra híbrida: a aprovação legislativa garante o marco legal, mas o percentual
    # reflete a execução física/orçamentária da política pública (ex.: casas entregues, médicos, desmatamento).
    prog = progresso_execucao if progresso_execucao is not None else (90 if norma_juridica else 50)
    if prog >= 90 and norma_juridica:
        return "cumprida", prog
    if prog >= 40 or norma_juridica:
        return "andamento", prog
    return "nao_iniciada", prog


def consultar_camara(camara_id: int) -> dict[str, str] | None:
    url = f"{CAMARA_API}/{camara_id}"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
            dados = payload.get("dados", {})
            st = dados.get("statusProposicao", {}) or {}
            situacao = st.get("descricaoSituacao") or st.get("descricaoTramitacao") or "Em tramitação"
            despacho = (st.get("despacho") or st.get("descricaoTramitacao") or "").strip()
            if len(despacho) > 160:
                despacho = despacho[:157].rstrip() + "..."
            data_hora = (st.get("dataHora") or "")[:10]
            return {
                "situacaoCamara": situacao,
                "ultimaTramitacao": despacho or situacao,
                "dataUltimaTramitacao": data_hora,
            }
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, KeyError) as exc:
        print(f"  [aviso] Falha ao consultar Câmara ID {camara_id}: {exc}", file=sys.stderr)
        return None


def consultar_salario_minimo_bcb() -> dict[str, str] | None:
    req = urllib.request.Request(BCB_SM_API, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            arr = json.loads(resp.read().decode("utf-8"))
            if arr and isinstance(arr, list):
                ultimo = arr[-1]
                return {"data": ultimo.get("data", ""), "valor": ultimo.get("valor", "")}
    except Exception as exc:
        print(f"  [aviso] Falha ao consultar BCB SGS 1619: {exc}", file=sys.stderr)
    return None


def sincronizar_automaticamente(dados: dict[str, Any]) -> int:
    alteracoes = 0
    print("Iniciando varredura automática nas APIs oficiais (Câmara dos Deputados + BCB)...")

    sm = consultar_salario_minimo_bcb()
    if sm:
        dados.setdefault("indicadoresOficiais", {})["salarioMinimoBCB"] = sm
        print(f"  [BCB SGS 1619] Salário mínimo vigente consultado: R$ {sm['valor']} (ref. {sm['data']})")

    for p in dados.get("propostas", []):
        camara_id = p.get("camaraId")
        if not camara_id:
            continue
        info = consultar_camara(int(camara_id))
        if not info:
            continue

        antes = (p.get("situacaoCamara"), p.get("ultimaTramitacao"), p.get("status"), p.get("progresso"))
        p["situacaoCamara"] = info["situacaoCamara"]
        p["ultimaTramitacao"] = info["ultimaTramitacao"]
        if info["dataUltimaTramitacao"]:
            p["dataUltimaTramitacao"] = info["dataUltimaTramitacao"]

        if not p.get("overrideManual", False):
            novo_status, novo_prog = inferir_status_legislativo(
                info["situacaoCamara"],
                p.get("regraAutomatica", "hibrida"),
                p.get("progressoExecucao"),
            )
            p["status"] = novo_status
            p["progresso"] = novo_prog

        depois = (p.get("situacaoCamara"), p.get("ultimaTramitacao"), p.get("status"), p.get("progresso"))
        if antes != depois:
            alteracoes += 1
        print(
            f"  [{p['num']}] {p['id']} ({p['proposicaoCodigo']}): "
            f"{p['situacaoCamara']} -> status={p['status']} ({p['progresso']}%)"
        )

    dados["atualizadoEm"] = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    salvar_dados(dados)
    print(f"Sincronização concluída ({alteracoes} propostas atualizadas). Arquivo salvo em {PROPOSTAS_PATH}")
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

    dados["atualizadoEm"] = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    salvar_dados(dados)
    print(
        f"Proposta [{alvo['num']}] '{alvo['id']}' atualizada internamente com sucesso:\n"
        f"  status={alvo['status']} | progresso={alvo['progresso']}% | overrideManual={alvo['overrideManual']}\n"
        f"  marco={alvo['metaIndicador']}"
    )


def listar_propostas(dados: dict[str, Any]) -> None:
    print(f"Última atualização: {dados.get('atualizadoEm', 'N/D')}")
    print("-" * 95)
    for p in dados.get("propostas", []):
        modo = "MANUAL" if p.get("overrideManual") else f"AUTO:{p.get('regraAutomatica', 'hibrida')}"
        print(
            f"[{p['num']}] {p['id']:<20} | {p['status']:<12} | {p['progresso']:>3}% | {modo:<13} | "
            f"{p.get('proposicaoCodigo', '')} ({p.get('situacaoCamara', '')})"
        )


def main() -> None:
    parser = argparse.ArgumentParser(description="Gerenciador interno e automático de propostas do VoVira.")
    parser.add_argument("--auto", action="store_true", help="Sincroniza automaticamente com a API da Câmara e BCB.")
    parser.add_argument("--list", action="store_true", help="Lista todas as propostas e seus status atuais.")
    parser.add_argument("--id", help="ID ou número (01..12) da proposta para atualização manual interna.")
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
        help="Remove a trava manual (overrideManual=False) para que a proposta volte a ser calculada automaticamente.",
    )

    args = parser.parse_args()
    dados = carregar_dados()

    if args.list:
        listar_propostas(dados)
        return

    if args.id:
        atualizar_manual(dados, args.id, args.status, args.progresso, args.marco, args.unlock_auto)
        return

    # Padrão se chamado com --auto ou sem argumentos: sincroniza automaticamente
    sincronizar_automaticamente(dados)


if __name__ == "__main__":
    main()
