import { useState } from 'react'
import {
  createOpportunityDraft,
  normalizeOpportunityInput,
  validateOpportunityInput,
} from '../application/opportunityInput.js'
import { EMPLOYMENT_TYPES, MODALITIES } from '../constants/domainOptions.js'

const ERROR_MESSAGES = {
  company: {
    required: 'Ingresá la empresa.',
  },
  title: {
    required: 'Ingresá el puesto.',
  },
  url: {
    required: 'Ingresá el enlace a la publicación.',
    invalid_url: 'Ingresá una URL válida que comience con http:// o https://.',
  },
  location: {
    invalid_text: 'Ingresá una ubicación válida.',
  },
  modality: {
    invalid_option: 'Elegí una modalidad válida.',
  },
  employmentType: {
    invalid_option: 'Elegí un tipo de jornada válido.',
  },
  publishedAt: {
    invalid_date: 'Ingresá una fecha de publicación válida.',
  },
  description: {
    invalid_text: 'Ingresá una descripción válida.',
  },
}

function getErrorMessage(fieldName, errorCode) {
  return ERROR_MESSAGES[fieldName]?.[errorCode] ?? 'Revisá este campo.'
}

function OpportunityForm({
  mode = 'create',
  initialValues,
  submissionWarning,
  onSubmit,
  onCancel,
}) {
  const [draft, setDraft] = useState(() =>
    createOpportunityDraft(initialValues),
  )
  const [errors, setErrors] = useState({})
  const isEditMode = mode === 'edit'

  const handleChange = (event) => {
    const { name, value } = event.target
    const nextDraft = { ...draft, [name]: value }

    setDraft((currentDraft) => ({ ...currentDraft, [name]: value }))

    if (Object.hasOwn(errors, name)) {
      const nextFieldError = validateOpportunityInput(nextDraft)[name]

      setErrors((currentErrors) => {
        const nextErrors = { ...currentErrors }

        if (nextFieldError) {
          nextErrors[name] = nextFieldError
        } else {
          delete nextErrors[name]
        }

        return nextErrors
      })
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const validationErrors = validateOpportunityInput(draft)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    const wasAccepted = onSubmit(normalizeOpportunityInput(draft))

    if (wasAccepted === false) {
      return
    }

    setDraft(createOpportunityDraft())
    setErrors({})
  }

  return (
    <section className="panel" aria-labelledby="opportunity-form-title">
      <div className="section-heading">
        <div>
          <p className="section-kicker">
            {isEditMode ? 'Edición' : 'Carga manual'}
          </p>
          <h2 id="opportunity-form-title">
            {isEditMode ? 'Editar oportunidad' : 'Agregar oportunidad'}
          </h2>
        </div>
        <p>
          {isEditMode
            ? 'Actualizá los datos de la oferta sin cambiar su identidad.'
            : 'Registrá los datos básicos de una oferta para revisarla.'}
        </p>
      </div>

      {submissionWarning && (
        <div className="edit-conflict-warning" role="alert">
          <strong>No pudimos guardar la edición</strong>
          <p>{submissionWarning}</p>
        </div>
      )}

      <form className="opportunity-form" onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="opportunity-company">
              Empresa <span className="required-indicator">(obligatorio)</span>
            </label>
            <input
              id="opportunity-company"
              name="company"
              value={draft.company}
              onChange={handleChange}
              autoFocus
              aria-invalid={Boolean(errors.company)}
              aria-describedby={errors.company ? 'opportunity-company-error' : undefined}
              required
            />
            {errors.company && (
              <p className="form-error" id="opportunity-company-error" role="alert">
                {getErrorMessage('company', errors.company)}
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="opportunity-title">
              Puesto <span className="required-indicator">(obligatorio)</span>
            </label>
            <input
              id="opportunity-title"
              name="title"
              value={draft.title}
              onChange={handleChange}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? 'opportunity-title-error' : undefined}
              required
            />
            {errors.title && (
              <p className="form-error" id="opportunity-title-error" role="alert">
                {getErrorMessage('title', errors.title)}
              </p>
            )}
          </div>

          <div className="form-field form-field-wide">
            <label htmlFor="opportunity-url">
              Enlace a la publicación <span className="required-indicator">(obligatorio)</span>
            </label>
            <input
              id="opportunity-url"
              name="url"
              type="url"
              value={draft.url}
              onChange={handleChange}
              aria-invalid={Boolean(errors.url)}
              aria-describedby={errors.url ? 'opportunity-url-error' : undefined}
              placeholder="https://empresa.com/empleos/oportunidad"
              required
            />
            {errors.url && (
              <p className="form-error" id="opportunity-url-error" role="alert">
                {getErrorMessage('url', errors.url)}
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="opportunity-location">Ubicación</label>
            <input
              id="opportunity-location"
              name="location"
              value={draft.location}
              onChange={handleChange}
              aria-invalid={Boolean(errors.location)}
              aria-describedby={
                errors.location ? 'opportunity-location-error' : undefined
              }
              placeholder="Ciudad o región"
            />
            {errors.location && (
              <p className="form-error" id="opportunity-location-error" role="alert">
                {getErrorMessage('location', errors.location)}
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="opportunity-modality">Modalidad</label>
            <select
              id="opportunity-modality"
              name="modality"
              value={draft.modality}
              onChange={handleChange}
              aria-invalid={Boolean(errors.modality)}
              aria-describedby={
                errors.modality ? 'opportunity-modality-error' : undefined
              }
            >
              <option value="">Sin especificar</option>
              {Object.values(MODALITIES).map((modality) => (
                <option key={modality.value} value={modality.value}>
                  {modality.label}
                </option>
              ))}
            </select>
            {errors.modality && (
              <p className="form-error" id="opportunity-modality-error" role="alert">
                {getErrorMessage('modality', errors.modality)}
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="opportunity-employment-type">Tipo de jornada</label>
            <select
              id="opportunity-employment-type"
              name="employmentType"
              value={draft.employmentType}
              onChange={handleChange}
              aria-invalid={Boolean(errors.employmentType)}
              aria-describedby={
                errors.employmentType
                  ? 'opportunity-employment-type-error'
                  : undefined
              }
            >
              <option value="">Sin especificar</option>
              {Object.values(EMPLOYMENT_TYPES).map((employmentType) => (
                <option key={employmentType.value} value={employmentType.value}>
                  {employmentType.label}
                </option>
              ))}
            </select>
            {errors.employmentType && (
              <p
                className="form-error"
                id="opportunity-employment-type-error"
                role="alert"
              >
                {getErrorMessage('employmentType', errors.employmentType)}
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="opportunity-published-at">Fecha de publicación</label>
            <input
              id="opportunity-published-at"
              name="publishedAt"
              type="date"
              value={draft.publishedAt}
              onChange={handleChange}
              aria-invalid={Boolean(errors.publishedAt)}
              aria-describedby={
                errors.publishedAt
                  ? 'opportunity-published-at-error'
                  : undefined
              }
            />
            {errors.publishedAt && (
              <p
                className="form-error"
                id="opportunity-published-at-error"
                role="alert"
              >
                {getErrorMessage('publishedAt', errors.publishedAt)}
              </p>
            )}
          </div>

          <div className="form-field form-field-wide">
            <label htmlFor="opportunity-description">Descripción</label>
            <textarea
              id="opportunity-description"
              name="description"
              value={draft.description}
              onChange={handleChange}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={
                errors.description
                  ? 'opportunity-description-error'
                  : undefined
              }
              rows="5"
              placeholder="Información relevante de la publicación"
            />
            {errors.description && (
              <p
                className="form-error"
                id="opportunity-description-error"
                role="alert"
              >
                {getErrorMessage('description', errors.description)}
              </p>
            )}
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
            {isEditMode ? 'Guardar cambios' : 'Guardar oportunidad'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default OpportunityForm
