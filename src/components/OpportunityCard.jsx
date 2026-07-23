import {
  EMPLOYMENT_TYPES,
  MODALITIES,
  OPPORTUNITY_STATUSES,
} from '../constants/domainOptions.js'

function getOptionLabel(options, value) {
  return Object.values(options).find((option) => option.value === value)?.label ?? value
}

function formatPublishedDate(value) {
  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('es-AR').format(date)
}

function OpportunityCard({
  opportunity,
  isEditDisabled,
  isBeingEdited,
  onEdit,
}) {
  return (
    <article className="opportunity-card">
      <div className="opportunity-card-header">
        <div>
          <p className="opportunity-company">{opportunity.company}</p>
          <h3>{opportunity.title}</h3>
        </div>
        <span className="status-badge">
          {getOptionLabel(OPPORTUNITY_STATUSES, opportunity.status)}
        </span>
      </div>

      {(opportunity.modality ||
        opportunity.employmentType ||
        opportunity.location ||
        opportunity.publishedAt) && (
        <dl className="opportunity-details">
          {opportunity.modality && (
            <div>
              <dt>Modalidad</dt>
              <dd>{getOptionLabel(MODALITIES, opportunity.modality)}</dd>
            </div>
          )}
          {opportunity.employmentType && (
            <div>
              <dt>Jornada</dt>
              <dd>{getOptionLabel(EMPLOYMENT_TYPES, opportunity.employmentType)}</dd>
            </div>
          )}
          {opportunity.location && (
            <div>
              <dt>Ubicación</dt>
              <dd>{opportunity.location}</dd>
            </div>
          )}
          {opportunity.publishedAt && (
            <div>
              <dt>Publicada</dt>
              <dd>{formatPublishedDate(opportunity.publishedAt)}</dd>
            </div>
          )}
        </dl>
      )}

      {opportunity.description && (
        <p className="opportunity-description">{opportunity.description}</p>
      )}

      <div className="opportunity-card-actions">
        <a
          className="button button-secondary opportunity-link"
          href={opportunity.url}
          target="_blank"
          rel="noreferrer"
        >
          Abrir publicación
        </a>
        <button
          className="button button-secondary"
          type="button"
          disabled={isEditDisabled}
          aria-label={`Editar ${opportunity.title} en ${opportunity.company}`}
          onClick={() => onEdit(opportunity)}
        >
          {isBeingEdited ? 'Editando' : 'Editar'}
        </button>
      </div>
    </article>
  )
}

export default OpportunityCard
