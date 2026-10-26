"""Coleta oficial do 2º turno de 2026 (eleição 6258) diretamente da API oficial de divulgação
do TSE (https://resultados.tse.jus.br/oficial/ele2026/6258/).

Baixa os 29 boletins consolidados oficiais (Brasil, Exterior e as 27 Unidades da Federação:
<abr>-c0001-e006258-u.json), valida que a soma das 27 UFs + Exterior (ZZ) coincide
exatamente (inteiro por inteiro) com o total nacional oficial do TSE, grava em
data/raw/tse_2026t2_uf_br.json e registra o SHA-256 em data/raw/MANIFEST.json.
"""
from __future__ import annotations

import json
import time
import urllib.request
from datetime import datetime, timezone

from http_util import RAW, UA, sha256_file, ssl_context

BASE = "https://resultados.tse.jus.br/oficial/ele2026/6258"
OUT_FILE = RAW / "tse_2026t2_uf_br.json"

UFS = [
    "ac", "al", "am", "ap", "ba", "ce", "df", "es", "go",
    "ma", "mg", "ms", "mt", "pa", "pb", "pe", "pi", "pr",
    "rj", "rn", "ro", "rr", "rs", "sc", "se", "sp", "to",
]


def fetch_json(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=20, context=ssl_context()) as r:
        return json.loads(r.read().decode("utf-8"))


def extract_agg(doc: dict) -> dict:
    e = doc["e"]
    v = doc["v"]
    cands = {}
    for agr in doc["carg"][0].get("agr", []):
        for par in agr.get("par", []):
            for c in par.get("cand", []):
                cands[c["n"]] = int(c["vap"])
    # Em 25/10/2026 23:26, 1 seção no país (423 eleitores) não foi apurada (esni=423);
    # 'te' é o total de eleitores aptos cadastrados e 'esa' os das seções apuradas.
    return {
        "aptos": int(e["te"]),
        "aptos_apurados": int(e["esa"]),
        "comp": int(e["c"]),
        "abst": int(e["a"]),
        "brancos": int(v["vb"]),
        "nulos": int(v["tvn"]),
        "validos": int(v["vv"]),
        "v": cands,
    }


def main() -> None:
    RAW.mkdir(parents=True, exist_ok=True)
    br_url = f"{BASE}/dados/br/br-c0001-e006258-u.json"
    zz_url = f"{BASE}/dados/zz/zz-c0001-e006258-u.json"

    print("Baixando consolidado nacional (BR) e exterior (ZZ) do 2º turno 2026 (TSE 6258)…")
    br_doc = fetch_json(br_url)
    zz_doc = fetch_json(zz_url)
    br_agg = extract_agg(br_doc)
    zz_agg = extract_agg(zz_doc)

    ufs_out = {}
    for uf in UFS:
        url = f"{BASE}/dados/{uf}/{uf}-c0001-e006258-u.json"
        doc = fetch_json(url)
        ufs_out[uf.upper()] = extract_agg(doc)
        time.sleep(0.08)

    # Validação de integridade aritmética estrita
    for field in ("aptos", "aptos_apurados", "comp", "abst", "brancos", "nulos", "validos"):
        soma = sum(u[field] for u in ufs_out.values()) + zz_agg[field]
        assert soma == br_agg[field], f"Divergência em {field}: soma={soma} != br={br_agg[field]}"
    for cand_num, votos_br in br_agg["v"].items():
        soma_c = sum(u["v"].get(cand_num, 0) for u in ufs_out.values()) + zz_agg["v"].get(cand_num, 0)
        assert soma_c == votos_br, f"Divergência candidato {cand_num}: soma={soma_c} != br={votos_br}"
    assert sum(br_agg["v"].values()) == br_agg["validos"]
    assert br_agg["validos"] + br_agg["brancos"] + br_agg["nulos"] == br_agg["comp"]

    payload = {
        "eleicao": "6258",
        "turno": 2,
        "ano": "2026",
        "fonte_oficial": br_url,
        "geracao": f"{br_doc['dg']} {br_doc['hg']}",
        "ultima_totalizacao": f"{br_doc['dt']} {br_doc['ht']}",
        "secoes_total": int(br_doc["s"]["ts"]),
        "secoes_apuradas": int(br_doc["s"]["sa"]),
        "candidatos": {
            "13": {"nome": "LULA", "partido": "PT", "situacao": "Eleito"},
            "22": {"nome": "FLÁVIO BOLSONARO", "partido": "PL", "situacao": "Não eleito"},
        },
        "nacional": br_agg,
        "exterior": zz_agg,
        "ufs": ufs_out,
    }
    OUT_FILE.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")

    manifest_path = RAW / "MANIFEST.json"
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    manifest["tse_2026t2_uf_br.json"] = {
        "url": br_url,
        "retrieved_utc": datetime.now(timezone.utc).isoformat(),
        "bytes": OUT_FILE.stat().st_size,
        "sha256": sha256_file(OUT_FILE),
    }
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
    print("OK — 2º turno 2026 (TSE 6258) coletado e 100% validado!")
    print("  Lula (13):", br_agg["v"]["13"], f"({100 * br_agg['v']['13'] / br_agg['validos']:.2f}%)")
    print("  Flávio Bolsonaro (22):", br_agg["v"]["22"], f"({100 * br_agg['v']['22'] / br_agg['validos']:.2f}%)")
    print("  Válidos:", br_agg["validos"], "| Comparecimento:", br_agg["comp"], "| Abstenção:", br_agg["abst"])


if __name__ == "__main__":
    main()
