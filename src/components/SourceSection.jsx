function SourceSection() {
  return (
    <section className="panel" aria-labelledby="sources-title">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Descubrimiento</p>
          <h2 id="sources-title">Fuentes de empleo</h2>
        </div>
        <p>Aprobá las páginas oficiales de empresas que el sistema podrá monitorear en el futuro.</p>
      </div>

      <div className="empty-state compact-empty-state">
        <h3>No hay fuentes aprobadas todavía.</h3>
        <button
          className="button button-secondary empty-state-action"
          type="button"
          title="Disponible en una etapa posterior"
          disabled
        >
          Descubrir empresas
        </button>
      </div>
    </section>
  )
}

export default SourceSection
