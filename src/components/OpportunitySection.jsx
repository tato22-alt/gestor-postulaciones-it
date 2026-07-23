import OpportunityCard from './OpportunityCard.jsx'

function OpportunitySection({ opportunities, onAddOpportunity }) {
  return (
    <section className="panel" aria-labelledby="opportunities-title">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Búsqueda laboral</p>
          <h2 id="opportunities-title">Oportunidades</h2>
        </div>
        <p>Ofertas detectadas o agregadas manualmente para revisar.</p>
      </div>

      {opportunities.length === 0 ? (
        <div className="empty-state compact-empty-state">
          <h3>Todavía no hay oportunidades analizadas.</h3>
          <p>Cuando agregues o detectemos una oferta, aparecerá aquí con su recomendación y advertencias.</p>
          <button
            className="button button-primary empty-state-action"
            type="button"
            onClick={onAddOpportunity}
          >
            Agregar oportunidad manualmente
          </button>
        </div>
      ) : (
        <div>
          <p className="opportunity-count" aria-live="polite">
            {opportunities.length} {opportunities.length === 1 ? 'oportunidad' : 'oportunidades'}
          </p>
          <div className="opportunity-list">
            {opportunities.map((opportunity) => (
              <OpportunityCard key={opportunity.id} opportunity={opportunity} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

export default OpportunitySection
