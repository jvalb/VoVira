"use client";

import { useEffect, useState } from "react";
import { fInt, fPct } from "@/lib/format";
import { formatarRankingWhatsApp } from "@/lib/share";
import { ModoRanking } from "@/lib/ranking";

type Modo = ModoRanking;

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
  const [copiado, setCopiado] = useState(false);

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

  const copiarRanking = () => {
    if (!r || r.linhas.length === 0) return;
    const url = typeof window !== "undefined" ? window.location.origin : "https://vovira.app";
    const txt = formatarRankingWhatsApp(r.linhas, modo, uf, url);
    navigator.clipboard.writeText(txt).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    });
  };

  const compartilharWhatsApp = () => {
    if (!r || r.linhas.length === 0) return;
    const url = typeof window !== "undefined" ? window.location.origin : "https://vovira.app";
    const txt = formatarRankingWhatsApp(r.linhas, modo, uf, url);
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          title: `VoVira — Cidades Prioritárias (${r.titulo})`,
          text: txt,
        })
        .catch(() => {
          window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(txt)}`, "_blank");
        });
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(txt)}`, "_blank");
    }
  };

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
          {r.linhas.length > 0 && (
            <div className="acoes-painel" role="toolbar" aria-label="Ações do ranking">
              <button
                type="button"
                className={`btn-acao ${copiado ? "btn-sucesso" : ""}`}
                onClick={copiarRanking}
                title="Copiar lista de cidades prioritárias formatada para WhatsApp"
              >
                {copiado ? "✓ Lista Copiada!" : "📋 Copiar Lista (WhatsApp)"}
              </button>
              <button
                type="button"
                className="btn-acao btn-whats"
                onClick={compartilharWhatsApp}
                title="Compartilhar lista de cidades no WhatsApp"
              >
                💬 WhatsApp
              </button>
            </div>
          )}
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
