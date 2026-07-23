import { OPPORTUNITY_STATUSES } from '../constants/domainOptions.js'

const ALL_STATUS_VALUE = 'all'

function getOpportunityLabel(count) {
  return count === 1 ? 'oportunidad' : 'oportunidades'
}

function OpportunityFilters({
  searchQuery,
  status,
  totalCount,
  visibleCount,
  onSearchChange,
  onStatusChange,
  onClearSearch,
  onResetFilters,
}) {
  const hasSearchText = searchQuery.length > 0
  const hasActiveSearch = searchQuery.trim().length > 0
  const hasStatusFilter = status !== null
  const hasActiveFilters = hasActiveSearch || hasStatusFilter
  const countMessage = hasActiveFilters
    ? `Mostrando ${visibleCount} de ${totalCount} ${getOpportunityLabel(totalCount)}`
    : `${totalCount} ${getOpportunityLabel(totalCount)}`

  const handleStatusChange = (event) => {
    onStatusChange(
      event.target.value === ALL_STATUS_VALUE ? null : event.target.value,
    )
  }

  return (
    <div className="opportunity-filters">
      <div className="opportunity-filter-grid">
        <div className="opportunity-filter-field">
          <label htmlFor="opportunity-search">Buscar por empresa o puesto</label>
          <input
            id="opportunity-search"
            name="opportunitySearch"
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="opportunity-filter-field">
          <label htmlFor="opportunity-status-filter">Estado</label>
          <select
            id="opportunity-status-filter"
            name="opportunityStatus"
            value={status ?? ALL_STATUS_VALUE}
            onChange={handleStatusChange}
          >
            <option value={ALL_STATUS_VALUE}>Todos los estados</option>
            {Object.values(OPPORTUNITY_STATUSES).map((opportunityStatus) => (
              <option key={opportunityStatus.value} value={opportunityStatus.value}>
                {opportunityStatus.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="opportunity-filter-summary">
        <p className="opportunity-count" aria-live="polite">
          {countMessage}
        </p>

        {(hasSearchText || hasStatusFilter) && (
          <div className="opportunity-filter-actions">
            {hasSearchText && (
              <button
                className="button button-secondary"
                type="button"
                onClick={onClearSearch}
              >
                Limpiar búsqueda
              </button>
            )}
            {hasStatusFilter && (
              <button
                className="button button-secondary"
                type="button"
                onClick={onResetFilters}
              >
                Restablecer filtros
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default OpportunityFilters
