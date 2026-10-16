import { useState } from "react";
import { resumo } from "@/lib/metrics";
import { fInt, fPct } from "@/lib/format";
import { Agg, Meta } from "@/lib/types";
import { formatarRoteiroNacional } from "@/lib/share";
import Simulador from "./Simulador";

export default function Nacional({ meta }: { meta: { nacional: Agg; candidatos: Meta["candidatos"]["2026t1"]; totalizacao: string } }) {
  const [copiado, setCopiado] = useState(false);
  const r = resumo(meta.nacional);
  const top = Object.entries(meta.nacional.v)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const copiarRoteiro = () => {
    const url = typeof window !== "undefined" ? window.location.origin : "https://vovira.app";
    const txt = formatarRoteiroNacional(meta.nacional, meta, url);
    navigator.clipboard.writeText(txt).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    });
  };

  const compartilharWhatsApp = () => {
    const url = typeof window !== "undefined" ? window.location.origin : "https://vovira.app";
    const txt = formatarRoteiroNacional(meta.nacional, meta, url);
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          title: "VoVira — Guia de Mobilização Nacional 2º Turno",
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
      <h2>Candidatos no Brasil</h2>
      <p className="nota">
        % dos votos válidos no 1º turno. Votos fora dos dois principais: <strong>{fInt(r.outros)}</strong> · brancos e nulos: <strong>{fInt(r.brancosNulos)}</strong>.
      </p>
      <div className="acoes-painel" role="toolbar" aria-label="Ações e compartilhamento nacional">
        <button
          type="button"
          className={`btn-acao ${copiado ? "btn-sucesso" : ""}`}
          onClick={copiarRoteiro}
          title="Copiar panorama nacional e metas de virada formatados para WhatsApp/Telegram"
        >
          {copiado ? "✓ Roteiro Copiado!" : "📋 Copiar Roteiro Brasil"}
        </button>
        <button
          type="button"
          className="btn-acao btn-whats"
          onClick={compartilharWhatsApp}
          title="Compartilhar panorama nacional no WhatsApp"
        >
          💬 WhatsApp
        </button>
        <button
          type="button"
          className="btn-acao"
          onClick={() => window.print()}
          title="Imprimir ou salvar PDF do panorama nacional"
        >
          🖨️ Imprimir
        </button>
      </div>
      <ul className="barras" aria-label="Candidatos no Brasil">
        {top.map(([n, v]) => {
          const p = (100 * v) / meta.nacional.validos;
          return (
            <li key={n}>
              <span className="b-nome">
                {meta.candidatos[n]?.nome ?? n} <small>({meta.candidatos[n]?.partido})</small>
              </span>
              <span className="b-trilho">
                <span className={`b-preench ${n === "13" ? "lula" : n === "22" ? "opo" : ""}`} style={{ width: `${Math.max(p, 0.3)}%` }} />
              </span>
              <span className="b-val">{fPct(p)}</span>
            </li>
          );
        })}
      </ul>
      <Simulador agg={meta.nacional} nome="Brasil" />
    </div>
  );
}
