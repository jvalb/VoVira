"""Etapa 1 — coleta de fontes OFICIAIS, sem qualquer transformação.

Cada arquivo bruto é gravado em data/raw/ exatamente como recebido; o manifesto
(data/raw/MANIFEST.json) registra URL, data/hora UTC da coleta, tamanho e SHA-256.
Qualquer pessoa pode baixar a mesma URL e conferir o hash.

Fontes:
  - TSE Dados Abertos (CDN oficial): votação por candidato/zona + detalhe da votação
    (comparecimento, abstenções, brancos, nulos), 2022 e 2026.
  - IBGE: malha municipal, lista de localidades e Censo 2022 (SIDRA).
"""
from __future__ import annotations

import json
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

from http_util import RAW, fetch_bytes, sha256_bytes, sha256_file, ssl_context, UA

TSE = "https://cdn.tse.jus.br/estatistica/sead/odsele"
IBGE = "https://servicodados.ibge.gov.br/api"
SIDRA = IBGE + "/v3/agregados/{t}/periodos/2022/variaveis/{v}?localidades=N1[all]|N3[all]|N6[all]&classificacao={c}"

# (arquivo, url)
TSE_FILES = [
    (f"votacao_candidato_munzona_{y}.zip", f"{TSE}/votacao_candidato_munzona/votacao_candidato_munzona_{y}.zip")
    for y in (2022, 2026)
] + [
    (f"detalhe_votacao_munzona_{y}.zip", f"{TSE}/detalhe_votacao_munzona/detalhe_votacao_munzona_{y}.zip")
    for y in (2022, 2026)
]

IBGE_FILES = [
    ("ibge_municipios.json", IBGE + "/v1/localidades/municipios"),
    (
        "ibge_malha_municipios.geojson",
        IBGE + "/v3/malhas/paises/BR?formato=application/vnd.geo+json&qualidade=minima&intrarregiao=municipio",
    ),
    ("ibge_pop_2022.json", IBGE + "/v3/agregados/4709/periodos/2022/variaveis/93?localidades=N1[all]|N3[all]|N6[all]"),
    # Domicílios (variável 381): esgoto, água, lixo, internet. Alfabetização: taxa 15+ (variável 2513, %).
    ("ibge_esgoto_2022.json", SIDRA.format(t=6805, v=381, c="11558[46292,46290]")),
    ("ibge_agua_2022.json", SIDRA.format(t=6803, v=381, c="1821[72129,72144]")),
    ("ibge_lixo_2022.json", SIDRA.format(t=6892, v=381, c="67[10972,2520]")),
    ("ibge_internet_2022.json", SIDRA.format(t=9936, v=381, c="2072[77584,77585]|63[95826]|125[2932]")),
    ("ibge_alfabetizacao_2022.json", SIDRA.format(t=9543, v=2513, c="2[6794]|86[95251]|287[100362]")),
]


def download_big(url: str, dest: Path) -> None:
    """Download em streaming (arquivos grandes), retomando se interrompido."""
    if dest.exists():
        return
    tmp = dest.with_suffix(dest.suffix + ".part")
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=300, context=ssl_context()) as r, open(tmp, "wb") as f:
        while chunk := r.read(1 << 20):
            f.write(chunk)
    tmp.rename(dest)


def main() -> None:
    RAW.mkdir(parents=True, exist_ok=True)
    manifest_path = RAW / "MANIFEST.json"
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}

    for name, url in TSE_FILES:
        dest = RAW / name
        if not dest.exists():
            print("baixando", name)
            download_big(url, dest)
            manifest[name] = {"url": url, "retrieved_utc": datetime.now(timezone.utc).isoformat()}
        elif name not in manifest:
            manifest[name] = {"url": url, "retrieved_utc": "anterior (arquivo já presente)"}
        manifest[name]["bytes"] = dest.stat().st_size
        manifest[name]["sha256"] = sha256_file(dest)

    for name, url in IBGE_FILES:
        dest = RAW / name
        if not dest.exists():
            print("baixando", name)
            body = fetch_bytes(url)
            dest.write_bytes(body)
            manifest[name] = {"url": url, "retrieved_utc": datetime.now(timezone.utc).isoformat()}
        manifest.setdefault(name, {"url": url, "retrieved_utc": "anterior"})
        manifest[name]["bytes"] = dest.stat().st_size
        manifest[name]["sha256"] = sha256_file(dest)

    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
    print("ok —", len(manifest), "arquivos no manifesto")


if __name__ == "__main__":
    main()
