import { useId, useRef, useState } from 'react'

// Edits a list of short free-text values (skills, target roles): one input to add a value
// and a "Quitar" button per value. Validation comes from the caller, so the rules stay in the
// domain and application layers.
function TextListEditor({
  label,
  placeholder,
  hint,
  maxLength,
  values,
  validate,
  errorMessages,
  addLabel,
  getRemoveLabel,
  countLabel,
  emptyTitle,
  emptyText,
  onAdd,
  onRemove,
}) {
  const idPrefix = useId()
  const [draft, setDraft] = useState('')
  const [error, setError] = useState(null)
  const inputRef = useRef(null)
  const removeButtonRefs = useRef([])
  const inputId = `${idPrefix}-input`
  const errorId = `${idPrefix}-error`
  const hintId = `${idPrefix}-hint`

  const handleChange = (event) => {
    setDraft(event.target.value)

    if (error) {
      setError(validate(event.target.value, values))
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const validationError = validate(draft, values)
    setError(validationError)

    if (validationError) return

    if (onAdd(draft) !== false) {
      setDraft('')
    }

    inputRef.current?.focus()
  }

  // After removing, focus the value that took its place, or the input when none is left,
  // so keyboard users do not lose their position.
  const handleRemove = (value, index) => {
    if (onRemove(value) === false) return

    const nextIndex = Math.min(index, values.length - 2)

    requestAnimationFrame(() => {
      if (nextIndex >= 0) {
        removeButtonRefs.current[nextIndex]?.focus()
      } else {
        inputRef.current?.focus()
      }
    })
  }

  return (
    <>
      <form className="profile-skill-form" onSubmit={handleSubmit} noValidate>
        <div className="form-field">
          <label htmlFor={inputId}>{label}</label>
          <input
            ref={inputRef}
            id={inputId}
            value={draft}
            onChange={handleChange}
            maxLength={maxLength}
            placeholder={placeholder}
            autoComplete="off"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${hintId} ${errorId}` : hintId}
          />
          <p className="form-hint" id={hintId}>
            {hint}
          </p>
          {error && (
            <p className="form-error" id={errorId} role="alert">
              {errorMessages[error]}
            </p>
          )}
        </div>
        <div className="form-actions">
          <button className="button button-primary" type="submit" disabled={Boolean(error)}>
            {addLabel}
          </button>
        </div>
      </form>

      {values.length === 0 ? (
        <div className="empty-state compact-empty-state">
          <h3>{emptyTitle}</h3>
          <p>{emptyText}</p>
        </div>
      ) : (
        <>
          <h3 className="profile-skills-title">{countLabel(values.length)}</h3>
          <ul className="profile-skill-list">
            {values.map((value, index) => (
              <li key={value} className="profile-skill">
                <span className="profile-skill-name">{value}</span>
                <button
                  ref={(element) => {
                    removeButtonRefs.current[index] = element
                  }}
                  className="button button-danger-outline profile-skill-remove"
                  type="button"
                  aria-label={getRemoveLabel(value)}
                  onClick={() => handleRemove(value, index)}
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}

export default TextListEditor
