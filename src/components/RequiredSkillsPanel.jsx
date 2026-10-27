import { useId, useState } from 'react'
import { validateSkillInput } from '../application/profileInput.js'
import { SKILLS_MAX_COUNT, SKILL_MAX_LENGTH } from '../domain/candidateSkillsPolicy.js'
import { getListTextKey } from '../domain/textListPolicy.js'
import TextListEditor from './TextListEditor.jsx'

const SKILL_ERROR_MESSAGES = {
  required: 'Ingresá una skill.',
  too_long: `Usá como máximo ${SKILL_MAX_LENGTH} caracteres.`,
  duplicate: 'Esa skill ya está en la lista.',
  too_many: `Podés cargar hasta ${SKILLS_MAX_COUNT} skills.`,
}

const SUGGESTION_ERRORS = {
  rate_limited: 'Se alcanzó el límite diario de sugerencias. Probá mañana o cargalas a mano.',
  provider_busy: 'El servicio de IA está ocupado. Probá de nuevo en unos minutos.',
  timeout: 'El servicio de IA tardó demasiado. Probá de nuevo.',
  network: 'No hay conexión con el servicio de IA. Revisá tu conexión y probá de nuevo.',
  invalid_input: 'La descripción es demasiado larga o está vacía para pedir sugerencias.',
  not_configured: 'Las sugerencias con IA todavía no están configuradas.',
}
const DEFAULT_SUGGESTION_ERROR = 'No pudimos obtener sugerencias. Probá de nuevo o cargalas a mano.'

// Required skills of one opportunity: typed by the user or suggested by AI. Suggestions are
// only a draft: nothing is saved until the user picks them and confirms.
function RequiredSkillsPanel({ opportunity, isAiAvailable, onSuggest, onSave }) {
  const idPrefix = useId()
  const [suggestions, setSuggestions] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const required = opportunity.requiredSkills
  const canSuggest = isAiAvailable && opportunity.description.trim().length > 0

  const requestSuggestions = async () => {
    setIsLoading(true)
    setMessage(null)
    setSuggestions(null)

    const result = await onSuggest(opportunity)

    setIsLoading(false)

    if (!result.ok) {
      setMessage(SUGGESTION_ERRORS[result.status] ?? DEFAULT_SUGGESTION_ERROR)
      return
    }

    const requiredKeys = new Set(required.map(getListTextKey))
    const fresh = result.skills.filter((skill) => !requiredKeys.has(getListTextKey(skill)))

    if (fresh.length === 0) {
      setMessage('La IA no encontró skills nuevas en la descripción.')
      return
    }

    setSuggestions(fresh.map((skill) => ({ skill, isSelected: true })))
  }

  const toggleSuggestion = (skill) => {
    setSuggestions((current) =>
      current.map((item) => (item.skill === skill ? { ...item, isSelected: !item.isSelected } : item)),
    )
  }

  const confirmSuggestions = () => {
    const selected = suggestions.filter((item) => item.isSelected).map((item) => item.skill)

    if (onSave(opportunity, [...required, ...selected]) !== false) {
      setSuggestions(null)
      setMessage(null)
    }
  }

  return (
    <details className="compatibility required-skills">
      <summary>
        <span className="compatibility-title">Skills requeridas</span>{' '}
        <span className="compatibility-counts">({required.length})</span>
      </summary>
      <div className="compatibility-body">
        <TextListEditor
          label="Skill requerida"
          placeholder="Ej.: Docker"
          hint="Lo que pide la oferta. Se compara con las skills de tu perfil."
          maxLength={SKILL_MAX_LENGTH}
          values={required}
          validate={validateSkillInput}
          errorMessages={SKILL_ERROR_MESSAGES}
          addLabel="Agregar skill requerida"
          getRemoveLabel={(skill) => `Quitar skill requerida: ${skill}`}
          countLabel={(count) => (count === 1 ? '1 skill requerida' : `${count} skills requeridas`)}
          emptyTitle="Sin skills requeridas."
          emptyText={canSuggest ? 'Cargalas a mano o pedile sugerencias a la IA.' : 'Cargalas a mano.'}
          onAdd={(skill) => onSave(opportunity, [...required, skill])}
          onRemove={(skill) =>
            onSave(
              opportunity,
              required.filter((current) => getListTextKey(current) !== getListTextKey(skill)),
            )
          }
        />

        {canSuggest && (
          <div className="required-skills-ai">
            <button
              className="button button-secondary"
              type="button"
              disabled={isLoading}
              aria-describedby={`${idPrefix}-ai-note`}
              onClick={requestSuggestions}
            >
              {isLoading ? 'Buscando skills…' : 'Sugerir skills con IA'}
            </button>
            <p className="form-hint" id={`${idPrefix}-ai-note`}>
              Se envían el título y la descripción de esta oferta a Groq, un servicio de IA. No se
              envían tus datos ni tu perfil. Revisá las sugerencias antes de guardarlas.
            </p>
          </div>
        )}

        <p className="required-skills-message" role="status">
          {message}
        </p>

        {suggestions && (
          <fieldset className="preference-option-group">
            <legend>Sugerencias de la IA</legend>
            <p className="form-hint">Desmarcá las que no correspondan.</p>
            {suggestions.map((item) => (
              <label key={item.skill} className="preference-option">
                <input
                  type="checkbox"
                  checked={item.isSelected}
                  onChange={() => toggleSuggestion(item.skill)}
                />
                {item.skill}
              </label>
            ))}
            <div className="form-actions">
              <button className="button button-secondary" type="button" onClick={() => setSuggestions(null)}>
                Descartar
              </button>
              <button
                className="button button-primary"
                type="button"
                disabled={!suggestions.some((item) => item.isSelected)}
                onClick={confirmSuggestions}
              >
                Agregar seleccionadas
              </button>
            </div>
          </fieldset>
        )}
      </div>
    </details>
  )
}

export default RequiredSkillsPanel
