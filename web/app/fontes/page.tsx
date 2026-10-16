import Link from "next/link";
import { store } from "@/lib/data";

export const metadata = { title: "Fontes e metodologia — VoVira" };

export default function Fontes() {
  const { meta } = store();
  const arquivos = Object.entries(meta.fontes);
  return (
    <main className="doc">
      <p>
        <Link href="/">← Voltar ao mapa</Link>
      </p>
      <h1>Fontes e metodologia</h1>

      <h2>Princípio: dados oficiais, sem alteração</h2>
      <ul>
        <li>
          Os arquivos originais do TSE e do IBGE são baixados diretamente dos servidores oficiais e guardados <strong>exatamente como recebidos</strong>. Abaixo estão URL, data de coleta e SHA-256 de cada um. Qualquer pessoa pode baixar o mesmo arquivo e conferir.
        </li>
        <li>
          Números eleitorais exibidos (votos, aptos, comparecimento, abstenções, brancos, nulos) são <strong>somas de inteiros</strong> do TSE. Nada é estimado, suavizado ou arredondado. Percentuais são calculados na hora, com as fórmulas abaixo.
        </li>
        <li>
          O processamento falha se alguma checagem não passar: soma dos votos por candidato = votos nominais válidos do TSE em cada zona; válidos + brancos + nulos = comparecimento; todo município do TSE corresponde a um único município do IBGE. Resultado desta versão: {" "}
          <strong>{String(meta.validacoes.municipios_tse_mapeados)} municípios mapeados, validações aprovadas</strong>.
        </li>
        <li>
          Os totais nacionais calculados reproduzem os resultados oficiais divulgados (ex.: 2022, 1º turno: Lula 57.259.504 votos; 2º turno: 60.345.999).
        </li>
      </ul>

      <h2>Fórmulas</h2>
      <ul>
        {Object.entries(meta.formulas).map(([k, v]) => (
          <li key={k}>
            <code>{k}</code>: {v}
          </li>
        ))}
      </ul>

      <h2>Limites que você deve conhecer</h2>
      <ul>
        <li>O 2º turno de 2026 ainda não aconteceu: os dados de 2026 são do 1º turno (04/10/2026).</li>
        <li>Comparar eleições diferentes mostra tendência, não causa: os candidatos mudam.</li>
        <li>Mapa por município. O TSE publica resultados por zona e seção, mas não existem polígonos oficiais de zonas; por isso zonas aparecem em tabela.</li>
        <li>Indicadores do Censo 2022 (IBGE) descrevem condições de vida; eles não dizem em quem as pessoas votam.</li>
        <li>O simulador usa hipóteses escolhidas por quem usa. Não é pesquisa nem previsão.</li>
        <li>Boa Esperança do Norte (MT) é município novo: não tem polígono na malha vigente do IBGE, nem série de 2022 ou Censo 2022 próprios.</li>
        <li>Votos no exterior entram nos totais nacionais, mas não em nenhum município.</li>
      </ul>

      <h2>Arquivos de origem</h2>
      <p>
        Totalização TSE: 1º turno 2026 — {meta.tse_arquivos["2026t1"].ultima_totalizacao}. Processado em {meta.gerado_em_utc}.
      </p>
      <table className="tab">
        <thead>
          <tr>
            <th>Arquivo</th>
            <th>URL de origem</th>
            <th>Coletado (UTC)</th>
            <th>SHA-256</th>
          </tr>
        </thead>
        <tbody>
          {arquivos.map(([nome, f]) => (
            <tr key={nome}>
              <th>{nome}</th>
              <td>
                <a href={f.url} target="_blank" rel="noreferrer noopener">
                  {f.url}
                </a>
              </td>
              <td>{f.coletado_utc}</td>
              <td>
                <code>{f.sha256}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
