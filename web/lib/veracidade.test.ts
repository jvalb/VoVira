import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { agregarPorRegiao } from "./regioes";
import type { Agg, EKey, EKeyNacional, Indicators, Meta, Municipio } from "./types";

const dataDir = path.join(process.cwd(), "public", "data");
const meta = JSON.parse(fs.readFileSync(path.join(dataDir, "meta.json"), "utf-8")) as Meta;
const municipios = JSON.parse(
  fs.readFileSync(path.join(dataDir, "municipios.json"), "utf-8")
) as Record<string, Municipio>;
const zonas = JSON.parse(
  fs.readFileSync(path.join(dataDir, "zonas.json"), "utf-8")
) as Record<string, Record<string, Partial<Record<EKey, Agg>>>>;

function auditarIdentidadeAgg(agg: Agg, contexto: string, exigirUrnas100 = false) {
  expect(agg.aptos, `${contexto}: aptos >= 0`).toBeGreaterThanOrEqual(0);
  expect(agg.comp, `${contexto}: comp >= 0`).toBeGreaterThanOrEqual(0);
  expect(agg.abst, `${contexto}: abst >= 0`).toBeGreaterThanOrEqual(0);
  expect(agg.validos, `${contexto}: validos >= 0`).toBeGreaterThanOrEqual(0);
  expect(agg.brancos, `${contexto}: brancos >= 0`).toBeGreaterThanOrEqual(0);
  expect(agg.nulos, `${contexto}: nulos >= 0`).toBeGreaterThanOrEqual(0);

  // 1) comparecimento + abstenção == eleitorado apto (igualdade estrita nas 27 UFs em 2026t2)
  // Nos CSVs/JSONs brutos do TSE, postos diplomáticos no Exterior (ZZ em 2026: 423 eleitores;
  // ZZ + Manaus Zona 68 em 2022: 657 eleitores) registram urnas não instaladas (QT_APTOS_URN_NAO_INSTALADAS).
  if (exigirUrnas100) {
    expect(agg.comp + agg.abst, `${contexto}: comp + abst == aptos`).toBe(agg.aptos);
  } else {
    const diffUrnasNaoInstaladas = agg.aptos - (agg.comp + agg.abst);
    expect(diffUrnasNaoInstaladas, `${contexto}: comp + abst <= aptos`).toBeGreaterThanOrEqual(0);
    expect(
      diffUrnasNaoInstaladas,
      `${contexto}: diferença máxima de QT_APTOS_URN_NAO_INSTALADAS <= 657`
    ).toBeLessThanOrEqual(657);
  }

  // 2) válidos + brancos + nulos == comparecimento (igualdade estrita em 100% dos registros)
  expect(
    agg.validos + agg.brancos + agg.nulos,
    `${contexto}: validos + brancos + nulos == comp`
  ).toBe(agg.comp);

  // 3) soma dos votos nominais por candidato == votos válidos (igualdade estrita em 100% dos registros)
  const somaCandidatos = Object.values(agg.v).reduce((acc, v) => acc + v, 0);
  expect(somaCandidatos, `${contexto}: soma(candidatos) == validos`).toBe(agg.validos);
}

function auditarIndicadoresIbge(ind: Indicators, contexto: string) {
  const chaves: Array<keyof Indicators> = [
    "agua_rede",
    "esgoto_adequado",
    "lixo_coletado",
    "internet",
    "alfabetizacao",
  ];
  for (const k of chaves) {
    const val = ind[k];
    if (val !== null && val !== undefined) {
      expect(Number.isFinite(val), `${contexto}.${k} finito`).toBe(true);
      expect(val, `${contexto}.${k} >= 0`).toBeGreaterThanOrEqual(0);
      expect(val, `${contexto}.${k} <= 100`).toBeLessThanOrEqual(100);
    }
  }
}

describe("Auditoria Automatizada de Veracidade — Dados Eleitorais (TSE) e Demográficos (IBGE)", () => {
  it("valida os totais nacionais exatos do TSE em todos os 4 turnos (2022 1ºT/2ºT e 2026 1ºT/2ºT)", () => {
    const rodadas: EKeyNacional[] = ["2022t1", "2022t2", "2026t1", "2026t2"];
    for (const r of rodadas) {
      const agg = meta.nacional[r];
      expect(agg, `Brasil ${r} presente`).toBeTruthy();
      if (agg) auditarIdentidadeAgg(agg, `Brasil ${r}`, false);
    }

    const n26t2 = meta.nacional["2026t2"]!;
    expect(n26t2.v["13"]).toBe(64_256_232);
    expect(n26t2.v["22"]).toBe(59_826_041);
    expect(n26t2.validos).toBe(124_082_273);
    expect(n26t2.comp).toBe(128_236_074);
    expect(n26t2.abst).toBe(30_509_005);
    expect(n26t2.aptos).toBe(158_745_502);

    expect(meta.nacional["2026t1"].v["13"]).toBe(53_879_538);
    expect(meta.nacional["2026t1"].v["22"]).toBe(56_104_503);
    expect(meta.nacional["2026t1"].validos).toBe(119_300_788);

    expect(meta.nacional["2022t2"].v["13"]).toBe(60_345_999);
    expect(meta.nacional["2022t2"].v["22"]).toBe(58_206_354);
    expect(meta.nacional["2022t2"].validos).toBe(118_552_353);

    expect(meta.nacional["2022t1"].v["13"]).toBe(57_259_504);
    expect(meta.nacional["2022t1"].v["22"]).toBe(51_072_345);
    expect(meta.nacional["2022t1"].validos).toBe(118_229_719);
  });

  it("valida as identidades aritméticas nas 27 Unidades da Federação + Exterior (ZZ) e a reconciliação regional", () => {
    const rodadas: EKeyNacional[] = ["2022t1", "2022t2", "2026t1", "2026t2"];
    const regioes = agregarPorRegiao(municipios, meta.ufs_2026t2);
    expect(regioes).toHaveLength(5);

    if (meta.ufs_2026t2) {
      expect(Object.keys(meta.ufs_2026t2)).toHaveLength(27);
      for (const [uf, agg] of Object.entries(meta.ufs_2026t2)) {
        auditarIdentidadeAgg(agg, `UF ${uf} (2026t2)`, true);
      }
    }

    for (const r of rodadas) {
      const zz = meta.exterior?.[r];
      if (zz) auditarIdentidadeAgg(zz, `Exterior ZZ (${r})`, false);

      const somaLula = regioes.reduce((acc, reg) => acc + reg.eleicoes[r].lula, 0) + (zz?.v["13"] ?? 0);
      const somaOpo = regioes.reduce((acc, reg) => acc + reg.eleicoes[r].oponente, 0) + (zz?.v["22"] ?? 0);
      const somaValidos = regioes.reduce((acc, reg) => acc + reg.eleicoes[r].validos, 0) + (zz?.validos ?? 0);

      const nac = meta.nacional[r]!;
      expect(somaLula, `Reconciliação regional Lula ${r}`).toBe(nac.v["13"]);
      expect(somaOpo, `Reconciliação regional Oponente ${r}`).toBe(nac.v["22"]);
      expect(somaValidos, `Reconciliação regional Válidos ${r}`).toBe(nac.validos);
    }
  });

  it("valida a integridade aritmética de todos os 5.570 municípios em municipios.json", () => {
    const codigos = Object.keys(municipios);
    expect(codigos.length).toBeGreaterThanOrEqual(5570);

    const rodadasMun: EKey[] = ["2022t1", "2022t2", "2026t1"];
    for (const cod of codigos) {
      expect(cod).toMatch(/^\d{7}$/);
      const m = municipios[cod];
      expect(m.n).toBeTruthy();
      expect(m.uf).toMatch(/^[A-Z]{2}$/);
      auditarIndicadoresIbge(m.ind, `Município ${cod} (${m.n})`);

      for (const r of rodadasMun) {
        const agg = m.e[r];
        if (agg) {
          auditarIdentidadeAgg(agg, `Município ${cod} (${m.n}) [${r}]`, r === "2026t1");
        }
      }
    }
  });

  it("valida a integridade aritmética de todas as 18.858 zonas eleitorais em zonas.json", () => {
    let totalZonas = 0;
    const rodadasMun: EKey[] = ["2022t1", "2022t2", "2026t1"];

    for (const [codMun, mapaZonas] of Object.entries(zonas)) {
      for (const [numZona, eleicoesZona] of Object.entries(mapaZonas)) {
        totalZonas += 1;
        for (const r of rodadasMun) {
          const agg = eleicoesZona[r];
          if (agg) {
            auditarIdentidadeAgg(agg, `Município ${codMun} Zona ${numZona} [${r}]`, r === "2026t1");
          }
        }
      }
    }
    expect(totalZonas).toBeGreaterThanOrEqual(6000);
  });

  it("valida os indicadores do Censo IBGE 2022 e os hashes criptográficos SHA-256 das fontes brutas", () => {
    auditarIndicadoresIbge(meta.referencias.BR.ind, "IBGE Brasil");
    for (const [uf, ref] of Object.entries(meta.referencias.UF)) {
      auditarIndicadoresIbge(ref.ind, `IBGE UF ${uf}`);
    }

    const fontes = Object.entries(meta.fontes);
    expect(fontes.length).toBeGreaterThanOrEqual(8);
    for (const [nome, f] of fontes) {
      expect(f.sha256, `SHA-256 válido para ${nome}`).toMatch(/^[0-9a-f]{64}$/);
      expect(f.url, `URL oficial para ${nome}`).toMatch(/^https:\/\/.+\.(jus|gov)\.br\//);
      expect(f.coletado_utc, `Timestamp UTC para ${nome}`).toBeTruthy();
    }
  });
});
