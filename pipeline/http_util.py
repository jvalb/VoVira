"""Utilitários HTTP do pipeline.

O servidor do IBGE (servicodados.ibge.gov.br) envia apenas o certificado folha, sem o
intermediário (Sectigo DV R36). Em vez de desabilitar a verificação TLS, carregamos
o intermediário (data/certs/ibge-intermediate.pem, validado contra as raízes do
sistema) como CA adicional. A verificação continua ativa.
"""
from __future__ import annotations

import gzip
import hashlib
import ssl
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
CERTS = ROOT / "data" / "certs"

UA = "VoVira-pipeline/0.1 (+dados publicos; contato: projeto local)"


def ssl_context() -> ssl.SSLContext:
    ctx = ssl.create_default_context()
    inter = CERTS / "ibge-intermediate.pem"
    if inter.exists():
        ctx.load_verify_locations(cafile=str(inter))
    return ctx


def fetch_bytes(url: str, timeout: int = 120) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout, context=ssl_context()) as r:
        body = r.read()
    if body[:2] == b"\x1f\x8b":  # alguns endpoints respondem com gzip mesmo sem Accept-Encoding
        body = gzip.decompress(body)
    return body


def sha256_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def sha256_file(p: Path) -> str:
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()
