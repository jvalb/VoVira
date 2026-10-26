"use client";

import { useId, useMemo, useState } from "react";
import { ResumoApi } from "@/lib/client-data";

function norm(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export default function Busca({ resumo, onPick }: { resumo: ResumoApi | null; onPick: (codigo: string) => void }) {
  const uid = useId();
  const inputId = `busca-in-${uid}`;
  const listId = `busca-lista-${uid}`;
  const [q, setQ] = useState("");
  const [ativo, setAtivo] = useState(0);

  const lista = useMemo(
    () => (resumo ? Object.entries(resumo.municipios).map(([c, m]) => ({ c, n: m.n, uf: m.uf, k: norm(m.n) })) : []),
    [resumo],
  );
  const res = useMemo(() => {
    const t = norm(q.trim());
    if (t.length < 2) return [];
    const m = lista.filter((x) => x.k.includes(t) || norm(`${x.n} ${x.uf}`).includes(t));
    m.sort((a, b) => Number(b.k.startsWith(t)) - Number(a.k.startsWith(t)) || a.n.localeCompare(b.n));
    return m.slice(0, 8);
  }, [q, lista]);

  const escolher = (c: string) => {
    onPick(c);
    setQ("");
  };

  return (
    <div className="busca" role="search">
      <label htmlFor={inputId} className="sr-only">
        Buscar município
      </label>
      <input
        id={inputId}
        type="search"
        placeholder="Buscar município…"
        autoComplete="off"
        value={q}
        disabled={!resumo}
        role="combobox"
        aria-expanded={res.length > 0}
        aria-controls={listId}
        onChange={(e) => {
          setQ(e.target.value);
          setAtivo(0);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setAtivo((a) => Math.min(a + 1, res.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setAtivo((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter" && res[ativo]) {
            escolher(res[ativo].c);
          } else if (e.key === "Escape") setQ("");
        }}
      />
      {res.length > 0 && (
        <ul id={listId} role="listbox" className="busca-lista">
          {res.map((x, i) => (
            <li key={x.c} role="option" aria-selected={i === ativo}>
              <button type="button" onClick={() => escolher(x.c)} className={i === ativo ? "ativo" : ""}>
                {x.n} <small>{x.uf}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
