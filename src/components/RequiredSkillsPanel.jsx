import { useId, useState } from 'react'
import { validateSkillInput } from '../application/profileInput.js'
import { SKILLS_MAX_COUNT, SKILL_MAX_LENGTH } from '../domain/candidateSkillsPolicy.js'
import { getListTextKey } from '../domain/textListPolicy.js'
import { DEFAULT_SUGGESTION_ERROR, SUGGESTION_ERRORS } from './aiSuggestionMessages.js'
import SkillSuggestionReview from './SkillSuggestionReview.jsx'
import TextListEditor from './TextListEditor.jsx'

const SKILL_ERROR_MESSAGES = {
  required: 'Ingresá una skill.',
  too_long: `Usá como máximo ${SKILL_MAX_LENGTH} caracteres.`,
  duplicate: 'Esa skill ya está en la lista.',
  too_many: `Podés cargar hasta ${SKILLS_MAX_COUNT} skills.`,
}


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

    setSuggestions(fresh)
  }

  const confirmSuggestions = (selected) => {
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
          <SkillSuggestionReview
            key={suggestions.join('\n')}
            skills={suggestions}
            onConfirm={confirmSuggestions}
            onDiscard={() => setSuggestions(null)}
          />
        )}
      </div>
    </details>
  )
}

export default RequiredSkillsPanel
