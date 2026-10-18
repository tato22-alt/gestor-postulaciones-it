import { useEffect, useRef } from 'react'
import { APPLICATION_STATUSES } from '../constants/domainOptions.js'
import {
  getAllowedApplicationTargetStatuses,
  isFinalApplicationStatus,
} from '../domain/applicationStatusPolicy.js'
import { formatDateString } from '../utils/date.js'
import ApplicationDetailsForm from './ApplicationDetailsForm.jsx'
import EmptyState from './EmptyState.jsx'
import useStatusChangeFocus from './useStatusChangeFocus.js'

function getStatusLabel(status) {
  return Object.values(APPLICATION_STATUSES).find((option) => option.value === status)?.label ?? status
}

function formatAppliedDate(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('es-AR').format(date)
}

function ApplicationCard({
  application,
  opportunity,
  isEditing,
  isEditDisabled,
  editWarning,
  onStatusChange,
  onEdit,
  onCancelEdit,
  onSubmitEdit,
}) {
  const allowedTargets = getAllowedApplicationTargetStatuses(application.status)
  const { cardRef, markStatusChangeRequested } = useStatusChangeFocus(application.status)
  const editButtonRef = useRef(null)
  const wasEditingRef = useRef(isEditing)

  // When the inline form closes, return focus to the button that opened it.
  useEffect(() => {
    if (wasEditingRef.current && !isEditing) {
      editButtonRef.current?.focus()
    }

    wasEditingRef.current = isEditing
  }, [isEditing])
  const company = opportunity?.company ?? 'Oportunidad no disponible'
  const title = opportunity?.title ?? 'La oportunidad original ya no está en la lista.'
  const accessibleName = opportunity ? `${opportunity.title} en ${opportunity.company}` : 'oportunidad no disponible'

  return (
    <article className="opportunity-card" ref={cardRef}>
      <div className="opportunity-card-header">
        <div>
          <p className="opportunity-company">{company}</p>
          <h3>{title}</h3>
        </div>
        <span className={`status-badge status-badge--${application.status}`}>
          {getStatusLabel(application.status)}
        </span>
      </div>

      <dl className="opportunity-details">
        <div>
          <dt>Fecha de postulación</dt>
          <dd>{formatAppliedDate(application.appliedAt)}</dd>
        </div>
        {application.followUpAt && (
          <div>
            <dt>Próximo seguimiento</dt>
            <dd>{formatDateString(application.followUpAt)}</dd>
          </div>
        )}
        {application.nextAction && (
          <div>
            <dt>Próxima acción</dt>
            <dd>{application.nextAction}</dd>
          </div>
        )}
      </dl>

      {application.notes && <p className="opportunity-description">{application.notes}</p>}

      {isEditing ? (
        <ApplicationDetailsForm
          key={application.id}
          application={application}
          submissionWarning={editWarning}
          onSubmit={onSubmitEdit}
          onCancel={onCancelEdit}
        />
      ) : (
        <div className="opportunity-card-actions">
          {opportunity && (
            <a
              className="button button-secondary opportunity-link"
              href={opportunity.url}
              target="_blank"
              rel="noreferrer"
            >
              Abrir publicación
            </a>
          )}
          <button
            ref={editButtonRef}
            className="button button-secondary"
            type="button"
            disabled={isEditDisabled}
            aria-label={`Editar postulación: ${accessibleName}`}
            onClick={() => onEdit(application)}
          >
            Editar postulación
          </button>
        </div>
      )}

      {isEditing ? null : allowedTargets.length > 0 ? (
        <div
          className="opportunity-status-actions"
          role="group"
          aria-label={`Cambiar estado de la postulación: ${accessibleName}`}
        >
          <span className="status-action-restore-label">Avanzar a</span>
          {allowedTargets.map((target) => (
            <button
              key={target.value}
              className="button button-secondary status-action-button"
              type="button"
              aria-label={`${target.label}: ${accessibleName}`}
              onClick={() => {
                // Final statuses go through a confirmation dialog, which restores focus itself.
                if (!isFinalApplicationStatus(target.value)) {
                  markStatusChangeRequested()
                }
                onStatusChange(application, target.value)
              }}
            >
              {target.label}
            </button>
          ))}
        </div>
      ) : (
        <p className="application-final-note">Proceso finalizado. Este estado ya no cambia.</p>
      )}
    </article>
  )
}

function ApplicationList({
  applications,
  opportunities,
  editingApplicationId,
  editWarning,
  onStatusChange,
  onEdit,
  onCancelEdit,
  onSubmitEdit,
  headingRef,
}) {
  const opportunitiesById = new Map(opportunities.map((opportunity) => [opportunity.id, opportunity]))

  return (
    <section className="panel" aria-labelledby="applications-title">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Procesos</p>
          <h2 id="applications-title" ref={headingRef} tabIndex={-1}>
            Postulaciones
          </h2>
        </div>
        <p>Procesos en los que ya enviaste tu solicitud.</p>
      </div>

      {applications.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="opportunity-list">
          {applications.map((application) => (
            <ApplicationCard
              key={application.id}
              application={application}
              opportunity={opportunitiesById.get(application.opportunityId) ?? null}
              isEditing={editingApplicationId === application.id}
              isEditDisabled={editingApplicationId !== null}
              editWarning={editWarning}
              onStatusChange={onStatusChange}
              onEdit={onEdit}
              onCancelEdit={onCancelEdit}
              onSubmitEdit={onSubmitEdit}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default ApplicationList
