import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import propostasData from "../public/data/propostas.json";

function recomputarHash(p: Record<string, unknown>): string {
  const campos = [
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
  ];
  const chave = campos.map((k) => String(p[k] ?? "")).join("|");
  return createHash("sha256").update(chave, "utf-8").digest("hex");
}

describe("propostas.json — veracidade das propostas nacionais (Câmara/Senado/Congresso) e estaduais (ALs)", () => {
  it("declara as 4 redes de APIs oficiais agrupadas com endpoints governamentais (.leg.br / .gov.br)", () => {
    expect(Array.isArray(propostasData.apisAgrupadas)).toBe(true);
    expect(propostasData.apisAgrupadas).toHaveLength(4);

    const ids = propostasData.apisAgrupadas.map((a) => a.id);
    expect(ids).toEqual([
      "senado-congresso",
      "camara-federal",
      "assembleias-estaduais",
      "bcb-sgs",
    ]);

    for (const api of propostasData.apisAgrupadas) {
      expect(api.docsUrl).toMatch(/^https:\/\/.+\.(leg|gov)\.br/);
    }
  });

  it("contém 24 propostas (16 nacionais bicamerais e 8 estaduais) com hashes SHA-256 íntegros", () => {
    expect(propostasData.atualizadoEm).toBeTruthy();
    expect(propostasData.propostas).toHaveLength(24);

    const nacionais = propostasData.propostas.filter((p) => p.esfera === "nacional");
    const estaduais = propostasData.propostas.filter((p) => p.esfera === "estadual");
    expect(nacionais).toHaveLength(16);
    expect(estaduais).toHaveLength(8);

    const idsVistos = new Set<string>();
    for (const p of propostasData.propostas) {
      expect(idsVistos.has(p.id)).toBe(false);
      idsVistos.add(p.id);

      expect(["cumprida", "andamento", "nao_iniciada"]).toContain(p.status);
      expect(p.progresso).toBeGreaterThanOrEqual(0);
      expect(p.progresso).toBeLessThanOrEqual(100);
      expect(p.ementaOficial?.trim().length).toBeGreaterThan(15);

      // Verifica integridade criptográfica SHA-256 dos metadados oficiais
      expect(p.sha256Verificacao).toMatch(/^[0-9a-f]{64}$/);
      expect(recomputarHash(p as unknown as Record<string, unknown>)).toBe(p.sha256Verificacao);
    }
  });

  it("valida rastreabilidade bicameral (Câmara + Senado/Congresso) em 100% das propostas nacionais", () => {
    const nacionais = propostasData.propostas.filter((p) => p.esfera === "nacional");
    for (const p of nacionais) {
      expect(p.uf).toBe("BR");
      expect(typeof p.camaraId).toBe("number");
      expect(p.camaraId).toBeGreaterThan(100000);
      expect(typeof p.senadoId).toBe("number");
      expect(p.senadoId).toBeGreaterThan(100000);
      expect(p.urlFonte).toMatch(/^https:\/\/www\.camara\.leg\.br\/proposicoesWeb\/fichadetramitacao\?idProposicao=\d+$/);
      expect(p.urlSenado).toMatch(/^https:\/\/legis\.senado\.leg\.br\/dadosabertos\/processo\/\d+$/);
    }
  });

  it("valida rastreabilidade nas Assembleias Legislativas Estaduais em 100% das propostas estaduais", () => {
    const ufsValidas = new Set(["PI", "PB", "AM", "TO", "MG", "AC"]);
    const estaduais = propostasData.propostas.filter((p) => p.esfera === "estadual");
    for (const p of estaduais) {
      expect(ufsValidas.has(p.uf)).toBe(true);
      expect(p.casaLegislativa).toBeTruthy();
      expect(p.apiEstadualUrl).toMatch(/^https:\/\/(sapl\.al\.[a-z]{2}\.leg\.br|dadosabertos\.almg\.gov\.br)\//);
      expect(p.urlFonte).toMatch(/^https:\/\/(sapl\.al\.[a-z]{2}\.leg\.br|www\.almg\.gov\.br)\//);
    }
  });
});
