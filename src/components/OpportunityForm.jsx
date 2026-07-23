import { useState } from 'react'
import { EMPLOYMENT_TYPES, MODALITIES } from '../constants/domainOptions.js'
import { isValidHttpUrl, normalizeHttpUrl } from '../utils/url.js'

const EMPTY_DRAFT = {
  company: '',
  title: '',
  url: '',
  location: '',
  modality: '',
  employmentType: '',
  publishedAt: '',
  description: '',
}

function getFieldError(fieldName, value) {
  if (fieldName === 'company' && !value.trim()) {
    return 'Ingresá la empresa.'
  }

  if (fieldName === 'title' && !value.trim()) {
    return 'Ingresá el puesto.'
  }

  if (fieldName === 'url') {
    if (!value.trim()) {
      return 'Ingresá el enlace a la publicación.'
    }

    if (!isValidHttpUrl(value)) {
      return 'Ingresá una URL válida que comience con http:// o https://.'
    }
  }

  return null
}

function validateDraft(draft) {
  return ['company', 'title', 'url'].reduce((errors, fieldName) => {
    const fieldError = getFieldError(fieldName, draft[fieldName])

    if (fieldError) {
      errors[fieldName] = fieldError
    }

    return errors
  }, {})
}

function normalizeDraft(draft) {
  return {
    company: draft.company.trim(),
    title: draft.title.trim(),
    url: normalizeHttpUrl(draft.url),
    location: draft.location.trim(),
    modality: draft.modality || null,
    employmentType: draft.employmentType || null,
    publishedAt: draft.publishedAt || null,
    description: draft.description.trim(),
  }
}

function OpportunityForm({ onSubmit, onCancel }) {
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [errors, setErrors] = useState({})

  const handleChange = (event) => {
    const { name, value } = event.target
    setDraft((currentDraft) => ({ ...currentDraft, [name]: value }))

    if (Object.hasOwn(errors, name)) {
      const fieldError = getFieldError(name, value)

      setErrors((currentErrors) => {
        const nextErrors = { ...currentErrors }

        if (fieldError) {
          nextErrors[name] = fieldError
        } else {
          delete nextErrors[name]
        }

        return nextErrors
      })
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const validationErrors = validateDraft(draft)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    onSubmit(normalizeDraft(draft))
    setDraft({ ...EMPTY_DRAFT })
    setErrors({})
  }

  return (
    <section className="panel" aria-labelledby="opportunity-form-title">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Carga manual</p>
          <h2 id="opportunity-form-title">Agregar oportunidad</h2>
        </div>
        <p>Registrá los datos básicos de una oferta para revisarla.</p>
      </div>

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
              aria-invalid={Boolean(errors.company)}
              aria-describedby={errors.company ? 'opportunity-company-error' : undefined}
              required
            />
            {errors.company && (
              <p className="form-error" id="opportunity-company-error" role="alert">
                {errors.company}
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
                {errors.title}
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
                {errors.url}
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
              placeholder="Ciudad o región"
            />
          </div>

          <div className="form-field">
            <label htmlFor="opportunity-modality">Modalidad</label>
            <select
              id="opportunity-modality"
              name="modality"
              value={draft.modality}
              onChange={handleChange}
            >
              <option value="">Sin especificar</option>
              {Object.values(MODALITIES).map((modality) => (
                <option key={modality.value} value={modality.value}>
                  {modality.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="opportunity-employment-type">Tipo de jornada</label>
            <select
              id="opportunity-employment-type"
              name="employmentType"
              value={draft.employmentType}
              onChange={handleChange}
            >
              <option value="">Sin especificar</option>
              {Object.values(EMPLOYMENT_TYPES).map((employmentType) => (
                <option key={employmentType.value} value={employmentType.value}>
                  {employmentType.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="opportunity-published-at">Fecha de publicación</label>
            <input
              id="opportunity-published-at"
              name="publishedAt"
              type="date"
              value={draft.publishedAt}
              onChange={handleChange}
            />
          </div>

          <div className="form-field form-field-wide">
            <label htmlFor="opportunity-description">Descripción</label>
            <textarea
              id="opportunity-description"
              name="description"
              value={draft.description}
              onChange={handleChange}
              rows="5"
              placeholder="Información relevante de la publicación"
            />
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
            Guardar oportunidad
          </button>
        </div>
      </form>
    </section>
  )
}

export default OpportunityForm
