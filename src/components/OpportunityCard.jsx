import {
  APPLICATION_STATUSES,
  EMPLOYMENT_TYPES,
  MODALITIES,
  OPPORTUNITY_STATUSES,
} from '../constants/domainOptions.js'
import { getApplicationRegistrationBlocker } from '../domain/applicationRegistrationPolicy.js'
import { getAllowedTargetStatuses } from '../domain/opportunityStatusPolicy.js'
import CompatibilitySummary from './CompatibilitySummary.jsx'
import RequiredSkillsPanel from './RequiredSkillsPanel.jsx'
import useStatusChangeFocus from './useStatusChangeFocus.js'

const ACTION_VERB_LABELS = {
  [OPPORTUNITY_STATUSES.SAVED.value]: 'Guardar',
  [OPPORTUNITY_STATUSES.DISMISSED.value]: 'Descartar',
  [OPPORTUNITY_STATUSES.ARCHIVED.value]: 'Archivar',
}

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

const DE_EMPHASIZED_STATUSES = new Set([
  OPPORTUNITY_STATUSES.DISMISSED.value,
  OPPORTUNITY_STATUSES.ARCHIVED.value,
])

function OpportunityCard({
  opportunity,
  application,
  sourceName,
  compatibility,
  isAiAvailable,
  onSuggestRequiredSkills,
  onSaveRequiredSkills,
  areStoredApplicationsUnavailable,
  isEditDisabled,
  isBeingEdited,
  onEdit,
  onStatusChange,
  onRequestDelete,
  onRequestApplicationRegistration,
}) {
  const allowedTargets = getAllowedTargetStatuses(opportunity.status)
  const { cardRef, markStatusChangeRequested } = useStatusChangeFocus(opportunity.status)
  const canRegisterApplication =
    !areStoredApplicationsUnavailable &&
    !application &&
    getApplicationRegistrationBlocker(opportunity, []) === null
  const isArchived = opportunity.status === OPPORTUNITY_STATUSES.ARCHIVED.value
  const cardClassName = DE_EMPHASIZED_STATUSES.has(opportunity.status)
    ? `opportunity-card opportunity-card--${opportunity.status}`
    : 'opportunity-card'

  return (
    <article className={cardClassName} ref={cardRef}>
      <div className="opportunity-card-header">
        <div>
          <p className="opportunity-company">{opportunity.company}</p>
          <h3>{opportunity.title}</h3>
        </div>
        <span className={`status-badge status-badge--${opportunity.status}`}>
          {getOptionLabel(OPPORTUNITY_STATUSES, opportunity.status)}
        </span>
      </div>

      {(opportunity.modality ||
        opportunity.employmentType ||
        opportunity.location ||
        opportunity.publishedAt ||
        sourceName) && (
        <dl className="opportunity-details">
          {sourceName && (
            <div>
              <dt>Fuente</dt>
              <dd>{sourceName}</dd>
            </div>
          )}
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

      <RequiredSkillsPanel
        opportunity={opportunity}
        isAiAvailable={isAiAvailable}
        onSuggest={onSuggestRequiredSkills}
        onSave={onSaveRequiredSkills}
      />

      {compatibility && <CompatibilitySummary result={compatibility} />}

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
        {canRegisterApplication && (
          <button
            className="button button-primary"
            type="button"
            aria-label={`Registrar postulación: ${opportunity.title} en ${opportunity.company}`}
            onClick={() => onRequestApplicationRegistration(opportunity)}
          >
            Registrar postulación
          </button>
        )}
      </div>

      {application && (
        <p className="opportunity-application-note">
          Postulación registrada · Estado:{' '}
          {getOptionLabel(APPLICATION_STATUSES, application.status)}
        </p>
      )}

      {allowedTargets.length > 0 && (
        <div
          className="opportunity-status-actions"
          role="group"
          aria-label={`Cambiar estado: ${opportunity.title} en ${opportunity.company}`}
        >
          {isArchived && (
            <span className="status-action-restore-label">Restaurar como</span>
          )}
          {allowedTargets.map((target) => {
            const label = isArchived
              ? target.label
              : ACTION_VERB_LABELS[target.value]
            return (
              <button
                key={target.value}
                className="button button-secondary status-action-button"
                type="button"
                aria-label={`${label}: ${opportunity.title} en ${opportunity.company}`}
                onClick={() => {
                  markStatusChangeRequested()
                  onStatusChange(opportunity, target.value)
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      )}

      <div className="opportunity-delete-action">
        {application ? (
          <p className="opportunity-delete-blocked">
            No se puede eliminar porque tiene una postulación registrada.
          </p>
        ) : areStoredApplicationsUnavailable ? (
          <p className="opportunity-delete-blocked">
            No se puede eliminar mientras las postulaciones guardadas no puedan leerse.
          </p>
        ) : (
          <button
            className="button button-danger-outline"
            type="button"
            aria-label={`Eliminar ${opportunity.title} en ${opportunity.company}`}
            onClick={() => onRequestDelete(opportunity)}
          >
            Eliminar
          </button>
        )}
      </div>
    </article>
  )
}

export default OpportunityCard
