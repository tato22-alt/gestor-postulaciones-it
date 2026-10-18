import { useId, useState } from 'react'
import {
  createApplicationDetailsDraft,
  normalizeApplicationDetailsInput,
  validateApplicationDetailsInput,
} from '../application/applicationDetailsInput.js'
import {
  APPLICATION_NEXT_ACTION_MAX_LENGTH,
  APPLICATION_NOTES_MAX_LENGTH,
} from '../domain/Application.js'
import { canHaveFollowUp } from '../domain/followUpPolicy.js'
import { toLocalDateString } from '../utils/date.js'

const ERROR_MESSAGES = {
  appliedDate: {
    required: 'Ingresá la fecha en que te postulaste.',
    invalid_date: 'Ingresá una fecha válida.',
    future_date: 'La fecha de postulación no puede ser futura.',
  },
  followUpDate: {
    invalid_date: 'Ingresá una fecha válida.',
    before_applied_date: 'El seguimiento no puede ser anterior a la fecha de postulación.',
    not_allowed: 'Una postulación finalizada no tiene seguimiento.',
  },
  nextAction: {
    too_long: `Usá como máximo ${APPLICATION_NEXT_ACTION_MAX_LENGTH} caracteres.`,
  },
  notes: {
    too_long: `Usá como máximo ${APPLICATION_NOTES_MAX_LENGTH} caracteres.`,
  },
}

function getErrorMessage(fieldName, errorCode) {
  return ERROR_MESSAGES[fieldName]?.[errorCode] ?? 'Revisá este campo.'
}

function ApplicationDetailsForm({ application, submissionWarning, onSubmit, onCancel }) {
  const fieldIdPrefix = useId()
  const [draft, setDraft] = useState(() => createApplicationDetailsDraft(application))
  const [errors, setErrors] = useState({})
  const allowsFollowUp = canHaveFollowUp(application.status)
  const today = toLocalDateString(new Date())
  const fieldId = (name) => `${fieldIdPrefix}-${name}`
  const errorId = (name) => `${fieldIdPrefix}-${name}-error`

  const validate = (nextDraft) =>
    validateApplicationDetailsInput(nextDraft, { status: application.status, today })

  const handleChange = (event) => {
    const { name, value } = event.target
    const nextDraft = { ...draft, [name]: value }

    setDraft(nextDraft)

    if (Object.keys(errors).length > 0) {
      setErrors(validate(nextDraft))
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const validationErrors = validate(draft)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    onSubmit(normalizeApplicationDetailsInput(draft))
  }

  // Escape behaves like Cancel while focus is inside this form.
  const handleKeyDown = (event) => {
    if (event.key !== 'Escape' || event.defaultPrevented || event.nativeEvent.isComposing) {
      return
    }

    event.preventDefault()
    onCancel()
  }

  const describedBy = (name) => (errors[name] ? errorId(name) : undefined)
  const renderError = (name) =>
    errors[name] && (
      <p className="form-error" id={errorId(name)} role="alert">
        {getErrorMessage(name, errors[name])}
      </p>
    )

  return (
    <form
      className="application-details-form"
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      noValidate
      aria-label="Editar postulación"
    >
      {submissionWarning && (
        <div className="edit-conflict-warning" role="alert">
          <strong>No pudimos guardar la edición</strong>
          <p>{submissionWarning}</p>
        </div>
      )}

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor={fieldId('appliedDate')}>
            Fecha de postulación <span className="required-indicator">(obligatorio)</span>
          </label>
          <input
            id={fieldId('appliedDate')}
            name="appliedDate"
            type="date"
            value={draft.appliedDate}
            max={today ?? undefined}
            onChange={handleChange}
            autoFocus
            required
            aria-invalid={Boolean(errors.appliedDate)}
            aria-describedby={describedBy('appliedDate')}
          />
          {renderError('appliedDate')}
        </div>

        {allowsFollowUp ? (
          <div className="form-field">
            <label htmlFor={fieldId('followUpDate')}>Próximo seguimiento</label>
            <input
              id={fieldId('followUpDate')}
              name="followUpDate"
              type="date"
              value={draft.followUpDate}
              min={draft.appliedDate || undefined}
              onChange={handleChange}
              aria-invalid={Boolean(errors.followUpDate)}
              aria-describedby={[describedBy('followUpDate'), fieldId('followUpDate-hint')]
                .filter(Boolean)
                .join(' ')}
            />
            <p className="form-hint" id={fieldId('followUpDate-hint')}>
              Dejalo vacío si no necesitás un seguimiento.
            </p>
            {renderError('followUpDate')}
          </div>
        ) : (
          <p className="form-hint">Esta postulación está finalizada, por eso no tiene seguimiento.</p>
        )}

        <div className="form-field form-field-wide">
          <label htmlFor={fieldId('nextAction')}>Próxima acción</label>
          <input
            id={fieldId('nextAction')}
            name="nextAction"
            value={draft.nextAction}
            onChange={handleChange}
            maxLength={APPLICATION_NEXT_ACTION_MAX_LENGTH}
            placeholder="Por ejemplo: escribir al reclutador"
            aria-invalid={Boolean(errors.nextAction)}
            aria-describedby={describedBy('nextAction')}
          />
          {renderError('nextAction')}
        </div>

        <div className="form-field form-field-wide">
          <label htmlFor={fieldId('notes')}>Notas</label>
          <textarea
            id={fieldId('notes')}
            name="notes"
            value={draft.notes}
            onChange={handleChange}
            maxLength={APPLICATION_NOTES_MAX_LENGTH}
            rows="4"
            aria-invalid={Boolean(errors.notes)}
            aria-describedby={describedBy('notes')}
          />
          {renderError('notes')}
        </div>
      </div>

      <div className="form-actions">
        <button className="button button-secondary" type="button" onClick={onCancel}>
          Cancelar
        </button>
        <button
          className="button button-primary"
          type="submit"
          disabled={Object.keys(errors).length > 0}
        >
          Guardar cambios
        </button>
      </div>
    </form>
  )
}

export default ApplicationDetailsForm
