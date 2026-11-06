import { describe, expect, it } from "vitest";
import propostasData from "../public/data/propostas.json";

describe("propostas.json — base oficial e sincronização automática", () => {
  it("contém os 12 compromissos estruturantes com metadados válidos", () => {
    expect(propostasData.atualizadoEm).toBeTruthy();
    expect(Array.isArray(propostasData.propostas)).toBe(true);
    expect(propostasData.propostas).toHaveLength(12);

    for (const p of propostasData.propostas) {
      expect(p.id).toBeTruthy();
      expect(["cumprida", "andamento", "nao_iniciada"]).toContain(p.status);
      expect(p.progresso).toBeGreaterThanOrEqual(0);
      expect(p.progresso).toBeLessThanOrEqual(100);
      expect(typeof p.camaraId).toBe("number");
      expect(p.proposicaoCodigo).toBeTruthy();
      expect(p.urlFonte).toMatch(/^https:\/\/www\.camara\.leg\.br\//);
    }
  });
});
