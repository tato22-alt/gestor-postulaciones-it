import { useId, useRef, useState } from 'react'
import { validateSkillInput } from '../application/profileInput.js'
import { SKILLS_MAX_COUNT, SKILL_MAX_LENGTH } from '../domain/candidateSkillsPolicy.js'

const ERROR_MESSAGES = {
  required: 'Ingresá una skill.',
  too_long: `Usá como máximo ${SKILL_MAX_LENGTH} caracteres.`,
  duplicate: 'Esa skill ya está en tu perfil.',
  too_many: `Podés cargar hasta ${SKILLS_MAX_COUNT} skills.`,
}

function ProfilePanel({ skills, onAddSkill, onRemoveSkill }) {
  const idPrefix = useId()
  const [draft, setDraft] = useState('')
  const [error, setError] = useState(null)
  const inputRef = useRef(null)
  const removeButtonRefs = useRef([])
  const inputId = `${idPrefix}-skill`
  const errorId = `${idPrefix}-skill-error`
  const hintId = `${idPrefix}-skill-hint`

  const handleChange = (event) => {
    setDraft(event.target.value)

    if (error) {
      setError(validateSkillInput(event.target.value, skills))
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const validationError = validateSkillInput(draft, skills)
    setError(validationError)

    if (validationError) return

    if (onAddSkill(draft) !== false) {
      setDraft('')
    }

    inputRef.current?.focus()
  }

  // After removing, focus the skill that took its place, or the input when none is left,
  // so keyboard users do not lose their position.
  const handleRemove = (skill, index) => {
    if (onRemoveSkill(skill) === false) return

    const remaining = skills.length - 1
    const nextIndex = Math.min(index, remaining - 1)

    requestAnimationFrame(() => {
      if (nextIndex >= 0) {
        removeButtonRefs.current[nextIndex]?.focus()
      } else {
        inputRef.current?.focus()
      }
    })
  }

  return (
    <section className="panel" aria-labelledby="profile-title">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Perfil</p>
          <h2 id="profile-title">
            Perfil profesional
          </h2>
        </div>
        <p>
          Cargá tus skills. Por ahora solo se guardan; más adelante servirán para comparar tu perfil
          con las oportunidades.
        </p>
      </div>

      <form className="profile-skill-form" onSubmit={handleSubmit} noValidate>
        <div className="form-field">
          <label htmlFor={inputId}>Skill</label>
          <input
            ref={inputRef}
            id={inputId}
            name="skill"
            value={draft}
            onChange={handleChange}
            maxLength={SKILL_MAX_LENGTH}
            placeholder="Ej.: React, SQL Server, Git"
            autoComplete="off"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${hintId} ${errorId}` : hintId}
          />
          <p className="form-hint" id={hintId}>
            Una por vez. Mayúsculas y acentos no cuentan como diferencia.
          </p>
          {error && (
            <p className="form-error" id={errorId} role="alert">
              {ERROR_MESSAGES[error]}
            </p>
          )}
        </div>
        <div className="form-actions">
          <button className="button button-primary" type="submit" disabled={Boolean(error)}>
            Agregar skill
          </button>
        </div>
      </form>

      {skills.length === 0 ? (
        <div className="empty-state compact-empty-state">
          <h3>Todavía no cargaste skills.</h3>
          <p>Agregá las tecnologías y herramientas que sabés usar.</p>
        </div>
      ) : (
        <>
          <h3 className="profile-skills-title">
            {skills.length === 1 ? '1 skill' : `${skills.length} skills`}
          </h3>
          <ul className="profile-skill-list">
            {skills.map((skill, index) => (
              <li key={skill} className="profile-skill">
                <span className="profile-skill-name">{skill}</span>
                <button
                  ref={(element) => {
                    removeButtonRefs.current[index] = element
                  }}
                  className="button button-danger-outline profile-skill-remove"
                  type="button"
                  aria-label={`Quitar skill: ${skill}`}
                  onClick={() => handleRemove(skill, index)}
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

export default ProfilePanel
