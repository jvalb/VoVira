import "server-only";
import fs from "node:fs";
import path from "node:path";
import { Meta, Municipio, Zonas } from "./types";

const DIR = path.join(process.cwd(), "public", "data");

interface Store {
  municipios: Record<string, Municipio>;
  zonas: Zonas;
  meta: Meta;
}

const g = globalThis as unknown as { __vovira?: Store };

function read<T>(name: string): T {
  return JSON.parse(fs.readFileSync(path.join(DIR, name), "utf8")) as T;
}

/** Carrega (uma vez por processo) os arquivos gerados pelo pipeline. */
export function store(): Store {
  if (!g.__vovira) {
    g.__vovira = {
      municipios: read<Record<string, Municipio>>("municipios.json"),
      zonas: read<Zonas>("zonas.json"),
      meta: read<Meta>("meta.json"),
    };
  }
  return g.__vovira;
}
