"""Etapa 2 — constrói os arquivos consumidos pelo app a partir dos dados brutos.

Princípios de integridade:
  * Os números eleitorais (votos, aptos, comparecimento, abstenções, brancos, nulos) são
    SOMAS DE INTEIROS dos arquivos do TSE. Nenhum valor é estimado, suavizado ou arredondado.
    Percentuais NÃO são gravados: o app os calcula na hora a partir dos inteiros.
  * Checagens automáticas (falham o build se violadas):
      - soma dos votos nominais dos candidatos por zona == QT_VOTOS_NOMINAIS_VALIDOS do detalhe
      - votos válidos + brancos + nulos == comparecimento
      - todo município do TSE casa com exatamente um município do IBGE
  * Indicadores do Censo 2022 (IBGE) são copiados/derivados por divisão simples, com a fórmula
    documentada em meta.json.
"""
from __future__ import annotations

import csv
import io
import json
import re
import sys
import unicodedata
import zipfile
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

from http_util import RAW, ROOT

OUT = ROOT / "web" / "public" / "data"
ELECTIONS = [("2022", 1), ("2022", 2), ("2026", 1)]  # (ano, turno)

csv.field_size_limit(sys.maxsize)


def key(e: tuple[str, int]) -> str:
    return f"{e[0]}t{e[1]}"


def norm(s: str) -> str:
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"[^A-Z0-9]", "", s.upper())


def read_zip_csv(zpath: Path, member: str):
    with zipfile.ZipFile(zpath) as z, z.open(member) as f:
        yield from csv.DictReader(io.TextIOWrapper(f, encoding="latin-1", newline=""), delimiter=";")


# ----------------------------------------------------------------------------------------
# IBGE: municípios
# ----------------------------------------------------------------------------------------
def load_ibge_municipios():
    data = json.loads((RAW / "ibge_municipios.json").read_text())
    out = {}
    for m in data:
        uf = None
        if m.get("microrregiao"):
            uf = m["microrregiao"]["mesorregiao"]["UF"]["sigla"]
        elif m.get("regiao-imediata"):
            uf = m["regiao-imediata"]["regiao-intermediaria"]["UF"]["sigla"]
        out[str(m["id"])] = {"nome": m["nome"], "uf": uf}
    return out


def load_uf_codes():
    """código IBGE de UF (2 dígitos) → sigla, a partir da própria lista oficial de municípios."""
    data = json.loads((RAW / "ibge_municipios.json").read_text())
    out = {}
    for m in data:
        uf = m["microrregiao"]["mesorregiao"]["UF"] if m.get("microrregiao") else m["regiao-imediata"]["regiao-intermediaria"]["UF"]
        out[str(uf["id"])] = uf["sigla"]
    return out


# Divergências conhecidas de grafia/código entre TSE e IBGE (chave: (UF, nome normalizado TSE)).
# Cada entrada é verificada: se o alvo não existir no IBGE o build falha.
ALIASES: dict[tuple[str, str], str] = {
    # variações de grafia (acento, apóstrofo, "de/do", "Th/T", "ou", "Mello/Melo")
    ("GO", "BOMJESUS"): "Bom Jesus de Goiás",
    ("MG", "BARAODEMONTEALTO"): "Barão do Monte Alto",
    ("MG", "DONAEUSEBIA"): "Dona Euzébia",
    ("MG", "SAOTHOMEDASLETRAS"): "São Tomé das Letras",
    ("MT", "SANTOANTONIODOLEVERGER"): "Santo Antônio de Leverger",
    ("PA", "ELDORADODOSCARAJAS"): "Eldorado do Carajás",
    ("PR", "MUNHOZDEMELLO"): "Munhoz de Melo",
    ("RO", "ESPIGAODOOESTE"): "Espigão D'Oeste",
    ("RO", "ALVORADADOOESTE"): "Alvorada D'Oeste",
    ("RR", "SAOLUIZ"): "São Luiz do Anauá",
    ("SE", "AMPARODESAOFRANCISCO"): "Amparo do São Francisco",
    ("SP", "SAOLUISDOPARAITINGA"): "São Luiz do Paraitinga",
    # renomeação oficial (2013): Boa Saúde → Januário Cicco (IBGE 2405306)
    ("RN", "BOASAUDE"): "Januário Cicco",
}


def build_tse_to_ibge(tse_rows, ibge):
    """tse_rows: set de (UF, CD_MUNICIPIO, NM_MUNICIPIO). Retorna {CD_MUNICIPIO_TSE: codigo_ibge}."""
    by_name = defaultdict(list)
    for code, m in ibge.items():
        by_name[(m["uf"], norm(m["nome"]))].append(code)
    mapping, unmatched = {}, []
    for uf, cd, nm in sorted(tse_rows):
        if uf == "ZZ":
            continue
        k = (uf, norm(nm))
        cands = by_name.get(k, [])
        if len(cands) != 1:
            alias = ALIASES.get(k)
            if alias:
                cands = by_name.get((uf, norm(alias)), [])
        if len(cands) == 1:
            mapping[cd] = cands[0]
        else:
            unmatched.append((uf, cd, nm, len(cands)))
    return mapping, unmatched


# ----------------------------------------------------------------------------------------
# TSE
# ----------------------------------------------------------------------------------------
def load_tse():
    """Retorna:
    cands[key] = {numero: {nome, partido}}
    votes[key][(uf, cd_mun, zona)] = {numero: votos}
    detail[key][(uf, cd_mun, zona)] = {aptos, comp, abst, brancos, nulos, validos}
    names[(uf, cd)] = nome TSE
    meta_tse[key] = {geracao, ultima_totalizacao}
    """
    cands, votes, detail, names, meta_tse = {}, {}, {}, {}, {}
    for ano in ("2022", "2026"):
        zc = RAW / f"votacao_candidato_munzona_{ano}.zip"
        zd = RAW / f"detalhe_votacao_munzona_{ano}.zip"
        for row in read_zip_csv(zc, f"votacao_candidato_munzona_{ano}_BR.csv"):
            if row["DS_CARGO"] != "Presidente":
                continue
            k = f"{ano}t{row['NR_TURNO']}"
            cands.setdefault(k, {})[row["NR_CANDIDATO"]] = {
                "nome": row["NM_URNA_CANDIDATO"],
                "partido": row["SG_PARTIDO"],
            }
            z = (row["SG_UF"], str(int(row["CD_MUNICIPIO"])), int(row["NR_ZONA"]))
            names[(row["SG_UF"], str(int(row["CD_MUNICIPIO"])))] = row["NM_MUNICIPIO"]
            d = votes.setdefault(k, {}).setdefault(z, defaultdict(int))
            d[row["NR_CANDIDATO"]] += int(row["QT_VOTOS_NOMINAIS"])
            meta_tse.setdefault(k, {})["geracao"] = f"{row['DT_GERACAO']} {row['HH_GERACAO']}"
        for row in read_zip_csv(zd, f"detalhe_votacao_munzona_{ano}_BR.csv"):
            if row["DS_CARGO"] != "Presidente":
                continue
            k = f"{ano}t{row['NR_TURNO']}"
            z = (row["SG_UF"], str(int(row["CD_MUNICIPIO"])), int(row["NR_ZONA"]))
            d = detail.setdefault(k, {}).setdefault(
                z, {"aptos": 0, "comp": 0, "abst": 0, "brancos": 0, "nulos": 0, "validos": 0}
            )
            d["aptos"] += int(row["QT_APTOS"])
            d["comp"] += int(row["QT_COMPARECIMENTO"])
            d["abst"] += int(row["QT_ABSTENCOES"])
            d["brancos"] += int(row["QT_VOTOS_BRANCOS"])
            d["nulos"] += int(row["QT_TOTAL_VOTOS_NULOS"])
            d["validos"] += int(row["QT_VOTOS_NOMINAIS_VALIDOS"])
            meta_tse.setdefault(k, {})["ultima_totalizacao"] = f"{row['DT_ULTIMA_TOTALIZACAO']} {row['HH_ULTIMA_TOTALIZACAO']}"
    return cands, votes, detail, names, meta_tse


def validate(votes, detail):
    problems = []
    for k in votes:
        for z, vs in votes[k].items():
            dt = detail[k].get(z)
            if dt is None:
                problems.append((k, z, "zona sem detalhe"))
                continue
            if sum(vs.values()) != dt["validos"]:
                problems.append((k, z, f"soma candidatos {sum(vs.values())} != válidos {dt['validos']}"))
    for k in detail:
        for z, dt in detail[k].items():
            if z not in votes[k]:
                problems.append((k, z, "zona de detalhe sem votos por candidato"))
            # nos aptos que comparecem: válidos + brancos + nulos
            if dt["validos"] + dt["brancos"] + dt["nulos"] != dt["comp"]:
                problems.append((k, z, f"válidos+brancos+nulos {dt['validos']+dt['brancos']+dt['nulos']} != comparecimento {dt['comp']}"))
    return problems


# ----------------------------------------------------------------------------------------
# IBGE: indicadores do Censo 2022
# ----------------------------------------------------------------------------------------
def sidra_series(fname: str):
    """Itera (codigo_ibge, {id_classificacao: id_categoria}, valor|None)."""
    data = json.loads((RAW / fname).read_text())
    for var in data:
        for res in var["resultados"]:
            cats = {}
            for c in res["classificacoes"]:
                cats[c["id"]] = next(iter(c["categoria"].keys()))
            for s in res["series"]:
                raw = next(iter(s["serie"].values()))
                try:
                    val = float(raw)
                except ValueError:
                    val = None
                yield s["localidade"]["id"], cats, val


def ratio_indicator(fname, class_id, num_cat, den_cat):
    num, den = {}, {}
    for code, cats, val in sidra_series(fname):
        c = cats.get(class_id)
        if c == num_cat:
            num[code] = val
        elif c == den_cat:
            den[code] = val
    out = {}
    for code, d in den.items():
        n = num.get(code)
        if n is not None and d:
            out[code] = round(100 * n / d, 2)
    return out


def load_indicators():
    pop = {c: int(v) for c, _, v in sidra_series("ibge_pop_2022.json") if v is not None}
    alfa = {c: v for c, _, v in sidra_series("ibge_alfabetizacao_2022.json") if v is not None}
    return {
        "pop": pop,
        "alfabetizacao": alfa,
        "esgoto_adequado": ratio_indicator("ibge_esgoto_2022.json", "11558", "46290", "46292"),
        "agua_rede": ratio_indicator("ibge_agua_2022.json", "1821", "72144", "72129"),
        "lixo_coletado": ratio_indicator("ibge_lixo_2022.json", "67", "2520", "10972"),
        "internet": ratio_indicator("ibge_internet_2022.json", "2072", "77585", "77584"),
    }


# ----------------------------------------------------------------------------------------
def geo_round(coords):
    if isinstance(coords[0], (int, float)):
        return [round(coords[0], 4), round(coords[1], 4)]
    return [geo_round(c) for c in coords]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    ibge = load_ibge_municipios()
    print("lendo TSE (pode levar ~1 min)…")
    cands, votes, detail, names, meta_tse = load_tse()

    problems = validate(votes, detail)
    if problems:
        print("FALHA NA VALIDAÇÃO:", len(problems))
        for p in problems[:30]:
            print("  ", p)
        sys.exit(1)
    print("validação: soma por zona e identidade comparecimento OK em", sum(len(v) for v in votes.values()), "zonas-eleição")

    tse_rows = {(uf, cd, nm) for (uf, cd), nm in names.items()}
    mapping, unmatched = build_tse_to_ibge(tse_rows, ibge)
    if unmatched:
        print("MUNICÍPIOS TSE SEM CORRESPONDÊNCIA ÚNICA NO IBGE:", len(unmatched))
        for u in unmatched:
            print("  ", u)
        sys.exit(2)
    # injetividade
    inv = defaultdict(list)
    for cd, ib in mapping.items():
        inv[ib].append(cd)
    dup = {k: v for k, v in inv.items() if len(v) > 1}
    if dup:
        print("CÓDIGOS IBGE COM MAIS DE UM CÓDIGO TSE:", dup)
        sys.exit(3)
    print("mapeamento TSE→IBGE:", len(mapping), "municípios")

    ind = load_indicators()
    uf_codes = load_uf_codes()
    IND_KEYS = ("alfabetizacao", "esgoto_adequado", "agua_rede", "lixo_coletado", "internet")
    referencias = {"BR": {"pop": ind["pop"].get("1"), "ind": {k: ind[k].get("1") for k in IND_KEYS}}, "UF": {}}
    for code, sigla in uf_codes.items():
        referencias["UF"][sigla] = {"pop": ind["pop"].get(code), "ind": {k: ind[k].get(code) for k in IND_KEYS}}

    # agregação por município / zona
    muni = {}
    zonas = {}
    exterior = {}

    def empty():
        return {"aptos": 0, "comp": 0, "abst": 0, "brancos": 0, "nulos": 0, "validos": 0, "v": defaultdict(int)}

    for ek in [key(e) for e in ELECTIONS]:
        for z, dt in detail[ek].items():
            uf, cd, zona = z
            rec = {**dt, "v": dict(votes[ek][z])}
            if uf == "ZZ":
                ex = exterior.setdefault(ek, empty())
                for f in ("aptos", "comp", "abst", "brancos", "nulos", "validos"):
                    ex[f] += dt[f]
                for c, n in votes[ek][z].items():
                    ex["v"][c] += n
                continue
            ib = mapping[cd]
            m = muni.setdefault(ib, {})
            agg = m.setdefault(ek, empty())
            for f in ("aptos", "comp", "abst", "brancos", "nulos", "validos"):
                agg[f] += dt[f]
            for c, n in votes[ek][z].items():
                agg["v"][c] += n
            zonas.setdefault(ib, {}).setdefault(str(zona), {})[ek] = rec

    for ib, m in muni.items():
        for ek, agg in m.items():
            agg["v"] = dict(agg["v"])
    for ek, ex in exterior.items():
        ex["v"] = dict(ex["v"])

    # saída: municípios
    out_m = {}
    for ib, info in ibge.items():
        entry = {
            "n": info["nome"],
            "uf": info["uf"],
            "pop": ind["pop"].get(ib),
            "ind": {k: ind[k].get(ib) for k in IND_KEYS},
            "e": muni.get(ib, {}),
        }
        out_m[ib] = entry
    sem_eleicao = [ib for ib, e in out_m.items() if not e["e"]]
    print("municípios IBGE sem dados eleitorais:", len(sem_eleicao), [out_m[i]["n"] for i in sem_eleicao][:10])

    (OUT / "municipios.json").write_text(json.dumps(out_m, ensure_ascii=False, separators=(",", ":")))
    (OUT / "zonas.json").write_text(json.dumps(zonas, ensure_ascii=False, separators=(",", ":")))

    # nacional = soma de todas as zonas + exterior (para conferência com o TSE)
    nac = {}
    for ek in [key(e) for e in ELECTIONS]:
        a = empty()
        for z, dt in detail[ek].items():
            for f in ("aptos", "comp", "abst", "brancos", "nulos", "validos"):
                a[f] += dt[f]
            for c, n in votes[ek][z].items():
                a["v"][c] += n
        a["v"] = dict(a["v"])
        nac[ek] = a

    # geometria (apenas redução de casas decimais para tamanho; geometria é a do IBGE, qualidade mínima)
    geo = json.loads((RAW / "ibge_malha_municipios.geojson").read_text())
    feats = []
    for f in geo["features"]:
        code = str(f["properties"]["codarea"])
        if code not in out_m:
            print("AVISO: polígono sem município:", code)
        feats.append({"type": "Feature", "properties": {"c": code}, "geometry": {"type": f["geometry"]["type"], "coordinates": geo_round(f["geometry"]["coordinates"])}})
    (OUT / "malha.geojson").write_text(json.dumps({"type": "FeatureCollection", "features": feats}, separators=(",", ":")))

    manifest = json.loads((RAW / "MANIFEST.json").read_text())
    meta = {
        "gerado_em_utc": datetime.now(timezone.utc).isoformat(),
        "eleicoes": {
            "2022t1": "Presidente — 1º turno 2022 (02/10/2022)",
            "2022t2": "Presidente — 2º turno 2022 (30/10/2022)",
            "2026t1": "Presidente — 1º turno 2026 (04/10/2026)",
        },
        "candidatos": cands,
        "tse_arquivos": meta_tse,
        "nacional": nac,
        "referencias": referencias,
        "exterior": exterior,
        "fontes": {k: {"url": v["url"], "sha256": v["sha256"], "coletado_utc": v["retrieved_utc"]} for k, v in manifest.items()},
        "formulas": {
            "percentual_votos": "votos do candidato ÷ votos válidos (nominais) × 100 — igual ao critério oficial do TSE para Presidente",
            "margem_pp": "(votos de Lula − votos do oponente) ÷ votos válidos (nominais) × 100",
            "abstencao": "abstenções ÷ aptos × 100",
            "virada_novos_votos": "máx(0, 1 − (votos de Lula − votos do oponente)) — votos novos para ficar 1 voto à frente",
            "virada_trocas": "⌈máx(0, 1 − (votos de Lula − votos do oponente)) ÷ 2⌉ — cada troca altera a diferença em 2 votos",
            "esgoto_adequado": "Censo 2022, SIDRA 6805: domicílios 'Rede geral, rede pluvial ou fossa ligada à rede' ÷ total × 100",
            "agua_rede": "Censo 2022, SIDRA 6803: domicílios com ligação à rede geral usada como forma principal ÷ total × 100",
            "lixo_coletado": "Censo 2022, SIDRA 6892: domicílios com lixo 'Coletado' ÷ total × 100",
            "internet": "Censo 2022, SIDRA 9936: domicílios com conexão domiciliar à Internet ÷ total × 100",
            "alfabetizacao": "Censo 2022, SIDRA 9543: taxa de alfabetização de 15+ anos (valor publicado pelo IBGE)",
        },
        "validacoes": {"soma_zona_igual_detalhe": True, "validos_brancos_nulos_igual_comparecimento": True, "municipios_tse_mapeados": len(mapping)},
    }
    (OUT / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1))
    print("ok →", OUT)
    for ek, a in nac.items():
        top = sorted(a["v"].items(), key=lambda x: -x[1])[:2]
        print(ek, "válidos", a["validos"], "top2", [(cands[ek][c]["nome"], n, round(100 * n / a["validos"], 2)) for c, n in top])


if __name__ == "__main__":
    main()
