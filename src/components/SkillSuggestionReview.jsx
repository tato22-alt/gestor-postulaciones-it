import { useState } from 'react'

// Review list for AI suggestions: every skill starts checked, and only the checked ones are
// passed to onConfirm. Nothing is saved from here.
function SkillSuggestionReview({ skills, onConfirm, onDiscard }) {
  const [selected, setSelected] = useState(() => new Set(skills))

  const toggle = (skill) => {
    setSelected((current) => {
      const next = new Set(current)

      if (next.has(skill)) {
        next.delete(skill)
      } else {
        next.add(skill)
      }

      return next
    })
  }

  return (
    <fieldset className="preference-option-group">
      <legend>Sugerencias de la IA</legend>
      <p className="form-hint">Desmarcá las que no correspondan.</p>
      {skills.map((skill) => (
        <label key={skill} className="preference-option">
          <input type="checkbox" checked={selected.has(skill)} onChange={() => toggle(skill)} />
          {skill}
        </label>
      ))}
      <div className="form-actions">
        <button className="button button-secondary" type="button" onClick={onDiscard}>
          Descartar
        </button>
        <button
          className="button button-primary"
          type="button"
          disabled={selected.size === 0}
          onClick={() => onConfirm(skills.filter((skill) => selected.has(skill)))}
        >
          Agregar seleccionadas
        </button>
      </div>
    </fieldset>
  )
}

export default SkillSuggestionReview
