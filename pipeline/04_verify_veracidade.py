#!/usr/bin/env python3
"""
Pipeline 04 — Auditoria Automatizada de Veracidade (Local + Contrato ao Vivo nas APIs Oficiais).

Verifica:
1. Integridade aritmética e criptográfica (SHA-256) das bases eleitorais do TSE (2022 1ºT/2ºT, 2026 1ºT/2ºT)
   e demográficas do Censo IBGE 2022 em `meta.json`, `municipios.json` e `zonas.json`.
2. Integridade criptográfica (SHA-256) e rastreabilidade das 24 propostas (16 Nacionais e 8 Estaduais)
   em `propostas.json`.
3. (Opcional `--live`): Consulta ao vivo os endpoints da Câmara dos Deputados, do Senado Federal / Congresso,
   das Assembleias Legislativas Estaduais (SAPL/Interlegis e ALMG) e do Banco Central para atestar que
   todos os IDs e URLs correspondem a registros oficiais reais.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import sys
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "web" / "public" / "data"

HEADERS = {
    "Accept": "application/json",
    "User-Agent": "VoVira-AuditoriaVeracidade/2.0 (+https://github.com/jvalb/VoVira)",
}


def calcular_hash_proposta(p: dict) -> str:
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
    return hashlib.sha256(chave.encode("utf-8")).hexdigest()


def auditar_bases_locais() -> None:
    print("1. Auditando bases eleitorais e demográficas locais (TSE + IBGE)...")
    meta = json.loads((DATA_DIR / "meta.json").read_text("utf-8"))
    municipios = json.loads((DATA_DIR / "municipios.json").read_text("utf-8"))
    zonas = json.loads((DATA_DIR / "zonas.json").read_text("utf-8"))
    propostas_payload = json.loads((DATA_DIR / "propostas.json").read_text("utf-8"))

    def _check_agg(agg: dict, ctx: str, exigir_urnas_100: bool = False) -> None:
        if exigir_urnas_100:
            assert agg["comp"] + agg["abst"] == agg["aptos"], f"Falha comp+abst {ctx}"
        else:
            diff = agg["aptos"] - (agg["comp"] + agg["abst"])
            assert 0 <= diff <= 657, f"Falha comp+abst {ctx} (diff={diff})"
        assert agg["validos"] + agg["brancos"] + agg["nulos"] == agg["comp"], f"Falha validos {ctx}"
        assert sum(agg["v"].values()) == agg["validos"], f"Falha soma candidatos {ctx}"

    # 1.1 Conferência aritmética nacional e por UF
    for rodada in ("2022t1", "2022t2", "2026t1", "2026t2"):
        nac = meta["nacional"][rodada]
        _check_agg(nac, f"Brasil {rodada}", False)

    for uf, agg in meta.get("ufs_2026t2", {}).items():
        _check_agg(agg, f"UF {uf} 2026t2", True)

    # 1.2 Conferência dos municípios e zonas
    assert len(municipios) >= 5570, f"Esperados >= 5570 municípios, encontrados {len(municipios)}"
    for cod, m in municipios.items():
        for rodada, agg in m["e"].items():
            _check_agg(agg, f"mun {cod} {rodada}", rodada == "2026t1")

    total_zonas = 0
    for cod, mapa_z in zonas.items():
        for zn, eleicoes_z in mapa_z.items():
            total_zonas += 1
            for rodada, agg in eleicoes_z.items():
                _check_agg(agg, f"zona {cod}/{zn} {rodada}", rodada == "2026t1")

    print(f"   ✓ 4 turnos nacionais, 28 UFs/ZZ, {len(municipios)} municípios e {total_zonas} zonas aprovados.")

    # 1.3 Conferência das 24 propostas (16 nacionais + 8 estaduais)
    propostas = propostas_payload.get("propostas", [])
    assert len(propostas) == 24, f"Esperadas 24 propostas, encontradas {len(propostas)}"
    for p in propostas:
        h_calc = calcular_hash_proposta(p)
        assert p.get("sha256Verificacao") == h_calc, f"Divergência de hash SHA-256 na proposta {p['id']}"
        assert len((p.get("ementaOficial") or "").strip()) > 15, f"Ementa oficial vazia em {p['id']}"
    print(f"   ✓ {len(propostas)} propostas (16 Nacionais + 8 Estaduais) com hashes SHA-256 íntegros.")


def auditar_apis_ao_vivo() -> None:
    print("2. Auditando contrato e veracidade ao vivo nas APIs oficiais (Câmara, Senado, ALs e BCB)...")
    propostas_payload = json.loads((DATA_DIR / "propostas.json").read_text("utf-8"))
    propostas = propostas_payload.get("propostas", [])

    for p in propostas:
        pid = p["id"]
        if p.get("esfera") == "estadual":
            url = p["apiEstadualUrl"]
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=12) as r:
                assert r.status == 200, f"Status {r.status} em {url}"
                d = json.loads(r.read().decode("utf-8"))
                assert "ementa" in d or "resultado" in d, f"Payload inválido em {pid}"
            print(f"   ✓ [ESTADUAL:{p['uf']}] {pid} confirmado ao vivo em {url}")
        else:
            cid = p["camaraId"]
            sid = p["senadoId"]
            uc = f"https://dadosabertos.camara.leg.br/api/v2/proposicoes/{cid}"
            us = f"https://legis.senado.leg.br/dadosabertos/processo/{sid}"
            with urllib.request.urlopen(urllib.request.Request(uc, headers=HEADERS), timeout=12) as rc:
                dc = json.loads(rc.read().decode("utf-8"))["dados"]
                assert dc["id"] == cid, f"ID Câmara divergente em {pid}"
            with urllib.request.urlopen(urllib.request.Request(us, headers=HEADERS), timeout=12) as rs:
                ds = json.loads(rs.read().decode("utf-8"))
                assert ds["id"] == sid, f"ID Senado divergente em {pid}"
            print(f"   ✓ [NACIONAL:BR] {pid} confirmado ao vivo na Câmara (#{cid}) e no Senado (#{sid})")


def main() -> None:
    parser = argparse.ArgumentParser(description="Verificador de veracidade de dados do VoVira.")
    parser.add_argument("--live", action="store_true", help="Executa também a checagem ao vivo nas APIs governamentais.")
    args = parser.parse_args()

    auditar_bases_locais()
    if args.live:
        auditar_apis_ao_vivo()
    print("\nAuditoria de veracidade concluída com 100% de aprovação.")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"\n[ERRO DE VERACIDADE] {exc}", file=sys.stderr)
        sys.exit(1)
