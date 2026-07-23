import OpportunityCard from './OpportunityCard.jsx'
import OpportunityFilters from './OpportunityFilters.jsx'

function OpportunitySection({
  opportunities,
  visibleOpportunities,
  searchQuery,
  statusFilter,
  onSearchChange,
  onStatusChange,
  onClearSearch,
  onResetFilters,
  onAddOpportunity,
  editingOpportunityId,
  isOpportunityFormVisible,
  onEditOpportunity,
}) {
  return (
    <section className="panel" aria-labelledby="opportunities-title">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Búsqueda laboral</p>
          <h2 id="opportunities-title">Oportunidades</h2>
        </div>
        <p>Ofertas detectadas o agregadas manualmente para revisar.</p>
      </div>

      <OpportunityFilters
        searchQuery={searchQuery}
        status={statusFilter}
        totalCount={opportunities.length}
        visibleCount={visibleOpportunities.length}
        onSearchChange={onSearchChange}
        onStatusChange={onStatusChange}
        onClearSearch={onClearSearch}
        onResetFilters={onResetFilters}
      />

      {opportunities.length === 0 ? (
        <div className="empty-state compact-empty-state">
          <h3>Todavía no hay oportunidades registradas.</h3>
          <p>Cuando agregues o detectemos una oferta, aparecerá acá para revisarla.</p>
          <button
            className="button button-primary empty-state-action"
            type="button"
            onClick={onAddOpportunity}
          >
            Agregar oportunidad manualmente
          </button>
        </div>
      ) : visibleOpportunities.length === 0 ? (
        <div className="empty-state compact-empty-state">
          <h3>No encontramos oportunidades que coincidan.</h3>
          <p>Las oportunidades guardadas siguen disponibles. Probá con otra búsqueda o restablecé los filtros actuales.</p>
          <button
            className="button button-secondary empty-state-action"
            type="button"
            onClick={onResetFilters}
          >
            Restablecer filtros
          </button>
        </div>
      ) : (
        <div className="opportunity-list">
          {visibleOpportunities.map((opportunity) => (
            <OpportunityCard
              key={opportunity.id}
              opportunity={opportunity}
              isEditDisabled={isOpportunityFormVisible}
              isBeingEdited={editingOpportunityId === opportunity.id}
              onEdit={onEditOpportunity}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default OpportunitySection
