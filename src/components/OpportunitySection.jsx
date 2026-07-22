function OpportunitySection() {
  return (
    <section className="panel" aria-labelledby="opportunities-title">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Compatibilidad</p>
          <h2 id="opportunities-title">Oportunidades recomendadas</h2>
        </div>
        <p>Ofertas que coinciden con tu perfil y preferencias.</p>
      </div>

      <div className="empty-state compact-empty-state">
        <h3>Todavía no hay oportunidades analizadas.</h3>
        <p>Cuando agregues o detectemos una oferta, aparecerá aquí con su recomendación y advertencias.</p>
        <button className="button button-primary empty-state-action" type="button">
          Agregar oportunidad manualmente
        </button>
      </div>
    </section>
  )
}

export default OpportunitySection
