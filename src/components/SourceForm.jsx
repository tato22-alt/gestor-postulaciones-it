import { useId, useState } from 'react'
import {
  createSourceDraft,
  normalizeSourceInput,
  validateSourceInput,
} from '../application/sourceInput.js'
import { SOURCE_COMPANY_NAME_MAX_LENGTH } from '../domain/CompanySource.js'

const ERROR_MESSAGES = {
  companyName: {
    required: 'Ingresá la empresa.',
    too_long: `Usá como máximo ${SOURCE_COMPANY_NAME_MAX_LENGTH} caracteres.`,
  },
  careersUrl: {
    required: 'Ingresá el enlace a la página de empleo.',
    invalid_url: 'Ingresá una URL válida que comience con http:// o https://.',
  },
}

function SourceForm({ initialValues, submitLabel, submissionWarning, onSubmit, onCancel, autoFocus = false }) {
  const idPrefix = useId()
  const [draft, setDraft] = useState(() => createSourceDraft(initialValues))
  const [errors, setErrors] = useState({})
  const fieldId = (name) => `${idPrefix}-${name}`
  const errorId = (name) => `${idPrefix}-${name}-error`

  const handleChange = (event) => {
    const { name, value } = event.target
    const nextDraft = { ...draft, [name]: value }

    setDraft(nextDraft)

    if (Object.keys(errors).length > 0) {
      setErrors(validateSourceInput(nextDraft))
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const validationErrors = validateSourceInput(draft)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    if (onSubmit(normalizeSourceInput(draft)) !== false && !initialValues) {
      setDraft(createSourceDraft())
    }
  }

  // Escape cancels only when the form has a cancel action (edit mode).
  const handleKeyDown = (event) => {
    if (!onCancel || event.key !== 'Escape' || event.defaultPrevented || event.nativeEvent.isComposing) {
      return
    }

    event.preventDefault()
    onCancel()
  }

  const renderField = (name, label, props) => (
    <div className="form-field">
      <label htmlFor={fieldId(name)}>
        {label} <span className="required-indicator">(obligatorio)</span>
      </label>
      <input
        id={fieldId(name)}
        name={name}
        value={draft[name]}
        onChange={handleChange}
        required
        aria-invalid={Boolean(errors[name])}
        aria-describedby={errors[name] ? errorId(name) : undefined}
        {...props}
      />
      {errors[name] && (
        <p className="form-error" id={errorId(name)} role="alert">
          {ERROR_MESSAGES[name][errors[name]]}
        </p>
      )}
    </div>
  )

  return (
    <form className="source-form" onSubmit={handleSubmit} onKeyDown={handleKeyDown} noValidate>
      {submissionWarning && (
        <div className="edit-conflict-warning" role="alert">
          <strong>No pudimos guardar la fuente</strong>
          <p>{submissionWarning}</p>
        </div>
      )}
      <div className="form-grid">
        {renderField('companyName', 'Empresa', {
          maxLength: SOURCE_COMPANY_NAME_MAX_LENGTH,
          autoFocus,
        })}
        {renderField('careersUrl', 'Página de empleo', {
          type: 'url',
          placeholder: 'https://empresa.com/empleos',
        })}
      </div>
      <div className="form-actions">
        {onCancel && (
          <button className="button button-secondary" type="button" onClick={onCancel}>
            Cancelar
          </button>
        )}
        <button className="button button-primary" type="submit" disabled={Object.keys(errors).length > 0}>
          {submitLabel}
        </button>
      </div>
    </form>
  )
}

export default SourceForm
