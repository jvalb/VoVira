"""Utilitários HTTP do pipeline.

O servidor do IBGE (servicodados.ibge.gov.br) envia apenas o certificado folha, sem o
intermediário (Sectigo DV R36). Em vez de desabilitar a verificação TLS, carregamos
o intermediário (data/certs/ibge-intermediate.pem, validado contra as raízes do
sistema) como CA adicional. A verificação continua ativa.
"""
from __future__ import annotations

import gzip
import hashlib
import json
import ssl
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
CERTS = ROOT / "data" / "certs"

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 (VoVira/2.0; +https://github.com/jvalb/VoVira)"


def ssl_context() -> ssl.SSLContext:
    ctx = ssl.create_default_context()
    inter = CERTS / "ibge-intermediate.pem"
    if inter.exists():
        ctx.load_verify_locations(cafile=str(inter))
    return ctx


def fetch_bytes(
    url: str,
    timeout: int = 120,
    retries: int = 1,
    backoff_factor: float = 1.0,
    headers: dict[str, str] | None = None,
) -> bytes:
    """Requisita bytes de uma URL com suporte opcional a retries e backoff."""
    req_headers = {"User-Agent": UA}
    if headers:
        req_headers.update(headers)

    last_exc: Exception | None = None
    for attempt in range(1, max(1, retries) + 1):
        try:
            req = urllib.request.Request(url, headers=req_headers)
            with urllib.request.urlopen(req, timeout=timeout, context=ssl_context()) as r:
                body = r.read()
            if body[:2] == b"\x1f\x8b":  # gzip descompressão
                body = gzip.decompress(body)
            return body
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, OSError) as exc:
            last_exc = exc
            is_transient = True
            if isinstance(exc, urllib.error.HTTPError) and exc.code in (400, 401, 403, 404):
                is_transient = False

            if attempt < retries and is_transient:
                sleep_sec = backoff_factor * (2 ** (attempt - 1))
                time.sleep(sleep_sec)
            else:
                break

    raise last_exc if last_exc else RuntimeError(f"Falha ao requisitar {url}")


def fetch_json(
    url: str,
    headers: dict[str, str] | None = None,
    timeout: int = 8,
    retries: int = 2,
    backoff_factor: float = 0.5,
) -> Any | None:
    """Requisita JSON com retries para erros transitórios (5xx, timeouts, conexões perdidas).

    Retorna None em caso de falha após esgotar retries ou se o endpoint retornar erro cliente (404/400).
    """
    req_headers = {
        "Accept": "application/json",
        "User-Agent": UA,
    }
    if headers:
        req_headers.update(headers)

    for attempt in range(1, max(1, retries) + 1):
        try:
            req = urllib.request.Request(url, headers=req_headers)
            with urllib.request.urlopen(req, timeout=timeout, context=ssl_context()) as r:
                raw = r.read()
            if raw[:2] == b"\x1f\x8b":
                raw = gzip.decompress(raw)
            return json.loads(raw.decode("utf-8"))
        except urllib.error.HTTPError as exc:
            # Erros de cliente (404, 400 etc.) geralmente não são transitórios
            if exc.code in (400, 401, 403, 404):
                print(f"  [aviso HTTP {exc.code}] {url}: {exc.reason}", file=sys.stderr)
                return None
            # Erros de servidor (500, 502, 503, 504, 429) são transitórios
            if attempt < retries:
                sleep_sec = backoff_factor * (2 ** (attempt - 1))
                time.sleep(sleep_sec)
            else:
                print(f"  [aviso HTTP {exc.code}] {url} após {retries} tentativas: {exc.reason}", file=sys.stderr)
                return None
        except (urllib.error.URLError, TimeoutError, OSError, json.JSONDecodeError) as exc:
            if attempt < retries:
                sleep_sec = backoff_factor * (2 ** (attempt - 1))
                time.sleep(sleep_sec)
            else:
                print(f"  [aviso de rede] {url} após {retries} tentativas: {exc}", file=sys.stderr)
                return None
    return None


def sha256_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def sha256_file(p: Path) -> str:
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()
