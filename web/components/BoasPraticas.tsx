export default function BoasPraticas() {
  return (
    <div className="painel-conteudo">
      <h2>Boas práticas e limites legais</h2>
      <p className="nota">Este app usa apenas dados públicos e agregados por município/zona. Não há dados de eleitores individuais e não deve haver.</p>
      <section className="card">
        <h3>Para conversar com credibilidade</h3>
        <ul className="lista">
          <li>Escute primeiro. Pergunte o que pesa na decisão da pessoa antes de apresentar argumentos.</li>
          <li>Use apenas informação que você verificou. Cite a fonte (os cards do app trazem o link do dado oficial).</li>
          <li>Não compartilhe boatos nem conteúdo fabricado ou editado para enganar: é ilegal em campanha e destrói a confiança.</li>
          <li>Compare propostas pelo que está registrado: os planos de governo ficam no DivulgaCandContas (TSE).</li>
          <li>Respeite quem pensa diferente. Convencer é diferente de vencer uma discussão.</li>
        </ul>
      </section>
      <section className="card">
        <h3>O que a lei eleitoral proíbe (resumo)</h3>
        <ul className="lista">
          <li>Compra de votos e qualquer vantagem em troca de voto.</li>
          <li>Oferecer transporte ou refeição a eleitores no dia da votação.</li>
          <li>Boca de urna e propaganda no dia da eleição.</li>
          <li>Divulgar fatos sabidamente inverídicos sobre candidatos ou o processo eleitoral.</li>
        </ul>
        <p className="nota">
          Resumo informativo, não é aconselhamento jurídico. Consulte as regras vigentes em{" "}
          <a href="https://www.tse.jus.br/" target="_blank" rel="noreferrer noopener">
            tse.jus.br
          </a>
          .
        </p>
      </section>
    </div>
  );
}
