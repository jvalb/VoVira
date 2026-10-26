import { store } from "@/lib/data";
import { agregarPorRegiao } from "@/lib/regioes";
import App from "@/components/App";

export default function Page() {
  const { meta, municipios } = store();
  const regioes = agregarPorRegiao(municipios, meta.ufs_2026t2);
  return (
    <App
      nacional={{
        nacional: meta.nacional["2026t1"],
        nacional2T: meta.nacional["2026t2"] ?? meta.nacional["2026t1"],
        candidatos: meta.candidatos["2026t1"],
        totalizacao: meta.tse_arquivos["2026t1"].ultima_totalizacao,
        totalizacao2T: meta.tse_arquivos["2026t2"]?.ultima_totalizacao ?? meta.tse_arquivos["2026t1"].ultima_totalizacao,
        municipiosMapeados: Number(meta.validacoes.municipios_tse_mapeados),
      }}
      regioes={regioes}
    />
  );
}
