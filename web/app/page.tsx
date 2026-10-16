import { store } from "@/lib/data";
import App from "@/components/App";

export default function Page() {
  const { meta } = store();
  return (
    <App
      nacional={{
        nacional: meta.nacional["2026t1"],
        candidatos: meta.candidatos["2026t1"],
        totalizacao: meta.tse_arquivos["2026t1"].ultima_totalizacao,
        municipiosMapeados: Number(meta.validacoes.municipios_tse_mapeados),
      }}
    />
  );
}
