"use client";

import { useEffect, useState } from "react";
import { fInt, fPct } from "@/lib/format";

type Modo = "mobilizacao" | "persuasao" | "recuperacao" | "equilibrio";

interface Linha {
  codigo: string;
  nome: string;
  uf: string;
  valor: number;
  unidade: string;
  lulaPct: number | null;
  oponentePct: number | null;
  margem: number;
  validos: number;
}

interface Resp {
  titulo: string;
  descricao: string;
  linhas: Linha[];
}

const ABAS: { k: Modo; rotulo: string }[] = [
  { k: "mobilizacao", rotulo: "Mobilizar" },
  { k: "persuasao", rotulo: "Conversar" },
  { k: "recuperacao", rotulo: "Recuperar" },
  { k: "equilibrio", rotulo: "Apertadas" },
];

const UFS = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");

export default function Ranking({ onSelect }: { onSelect: (codigo: string) => void }) {
  const [modo, setModo] = useState<Modo>("mobilizacao");
  const [uf, setUf] = useState("");
  const [r, setR] = useState<Resp | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    setR(null);
    setErro(null);
    fetch(`/api/ranking?modo=${modo}&limite=30${uf ? `&uf=${uf}` : ""}`)
      .then((x) => (x.ok ? x.json() : Promise.reject(new Error(`HTTP ${x.status}`))))
      .then((j: Resp) => vivo && setR(j))
      .catch((e: Error) => vivo && setErro(e.message));
    return () => {
      vivo = false;
    };
  }, [modo, uf]);

  return (
    <div className="painel-conteudo">
      <h2>Onde atuar</h2>
      <p className="nota">
        Na eleição presidencial vale o <strong>total nacional de votos</strong>: virar um município não vale mais que somar votos. Estas listas mostram onde há mais votos em jogo, com hipóteses explícitas.
      </p>
      <div className="seletor" role="tablist" aria-label="Critério">
        {ABAS.map((a) => (
          <button key={a.k} role="tab" aria-selected={modo === a.k} onClick={() => setModo(a.k)}>
            {a.rotulo}
          </button>
        ))}
      </div>
      <label className="campo">
        Estado
        <select value={uf} onChange={(e) => setUf(e.target.value)}>
          <option value="">Todos</option>
          {UFS.map((u) => (
            <option key={u}>{u}</option>
          ))}
        </select>
      </label>
      {erro && <p className="erro">Falha ao carregar: {erro}</p>}
      {!r && !erro && <p className="nota">Carregando…</p>}
      {r && (
        <>
          <h3>{r.titulo}</h3>
          <p className="nota">{r.descricao}</p>
          <ol className="rank">
            {r.linhas.map((l) => (
              <li key={l.codigo}>
                <button onClick={() => onSelect(l.codigo)}>
                  <span className="r-nome">
                    {l.nome} <small>{l.uf}</small>
                  </span>
                  <span className="r-val">
                    {modo === "equilibrio" ? l.valor.toFixed(2).replace(".", ",") : fInt(l.valor)} <small>{l.unidade}</small>
                  </span>
                  <span className="r-sub">
                    Lula {fPct(l.lulaPct, 1)} · oponente {fPct(l.oponentePct, 1)} · {fInt(l.validos)} válidos
                  </span>
                </button>
              </li>
            ))}
            {r.linhas.length === 0 && <li className="nota">Nenhum município neste filtro.</li>}
          </ol>
        </>
      )}
    </div>
  );
}
