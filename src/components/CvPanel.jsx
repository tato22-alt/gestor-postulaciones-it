import { useId, useState } from 'react'
import { getSkillKey } from '../domain/candidateSkillsPolicy.js'
import {
  CV_AI_MAX_LENGTH,
  CV_FILE_MAX_BYTES,
  CV_TEXT_MAX_LENGTH,
  normalizeCvText,
  redactContactData,
} from '../domain/cvPolicy.js'
import { DEFAULT_SUGGESTION_ERROR, SUGGESTION_ERRORS } from './aiSuggestionMessages.js'
import SkillSuggestionReview from './SkillSuggestionReview.jsx'

const PDF_ERRORS = {
  too_large: 'El PDF supera los 5 MB.',
  not_pdf: 'Elegí un archivo PDF.',
  password_protected: 'El PDF está protegido con contraseña. Quitale la contraseña o pegá el texto.',
  unreadable: 'No pudimos leer el PDF. Probá con otro archivo o pegá el texto.',
  empty: 'El PDF no tiene texto seleccionable (puede ser una imagen escaneada). Pegá el texto a mano.',
}

/**
 * The CV text of the profile. A PDF is read in the browser into an editable draft; the user
 * saves it explicitly. AI suggestions use the saved text after contact data is removed, and
 * the user sees exactly what will be sent before confirming.
 */
function CvPanel({ cvText, skills, isAiAvailable, readPdf, onSaveCv, onSuggestFromCv, onAddSkills }) {
  const idPrefix = useId()
  const [draft, setDraft] = useState(cvText)
  const [draftError, setDraftError] = useState(null)
  const [isReadingPdf, setIsReadingPdf] = useState(false)
  const [preview, setPreview] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [suggestions, setSuggestions] = useState(null)
  const draftId = `${idPrefix}-draft`
  const isDirty = normalizeCvText(draft) !== cvText

  const handleFile = async (event) => {
    const [file] = event.target.files
    event.target.value = ''

    if (!file) return

    setDraftError(null)

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setDraftError(PDF_ERRORS.not_pdf)
      return
    }

    if (file.size > CV_FILE_MAX_BYTES) {
      setDraftError(PDF_ERRORS.too_large)
      return
    }

    setIsReadingPdf(true)
    const result = await readPdf(file)
    setIsReadingPdf(false)

    if (!result.ok) {
      setDraftError(PDF_ERRORS[result.status] ?? PDF_ERRORS.unreadable)
      return
    }

    const text = normalizeCvText(result.text)

    if (!text) {
      setDraftError(PDF_ERRORS.empty)
      return
    }

    setDraft(text)
    setMessage(
      result.truncatedPages
        ? 'Se leyeron las primeras 20 páginas. Revisá el texto y guardalo.'
        : 'Se leyó el PDF. Revisá el texto y guardalo.',
    )
  }

  const save = () => {
    if (normalizeCvText(draft).length > CV_TEXT_MAX_LENGTH) {
      setDraftError(`El CV supera los ${CV_TEXT_MAX_LENGTH.toLocaleString('es-AR')} caracteres. Acortalo antes de guardarlo.`)
      return
    }

    if (onSaveCv(draft) !== false) {
      setDraftError(null)
      setPreview(null)
      setSuggestions(null)
      setMessage(null)
    }
  }

  const preparePreview = () => {
    setMessage(null)
    setSuggestions(null)
    setPreview(redactContactData(cvText))
  }

  const send = async () => {
    const { text } = preview

    if (text.length > CV_AI_MAX_LENGTH) {
      setPreview(null)
      setMessage(
        `Para pedir sugerencias, el CV puede tener hasta ${CV_AI_MAX_LENGTH.toLocaleString('es-AR')} caracteres.`,
      )
      return
    }

    setPreview(null)
    setIsLoading(true)
    const result = await onSuggestFromCv(text)
    setIsLoading(false)

    if (!result.ok) {
      setMessage(SUGGESTION_ERRORS[result.status] ?? DEFAULT_SUGGESTION_ERROR)
      return
    }

    const profileKeys = new Set(skills.map(getSkillKey))
    const fresh = result.skills.filter((skill) => !profileKeys.has(getSkillKey(skill)))

    if (fresh.length === 0) {
      setMessage('La IA no encontró skills nuevas en tu CV.')
      return
    }

    setSuggestions(fresh)
  }

  const confirmSuggestions = (selected) => {
    if (onAddSkills(selected) !== false) {
      setSuggestions(null)
      setMessage(null)
    }
  }

  return (
    <div className="cv-panel">
      <h3 className="profile-skills-title">CV</h3>

      <div className="form-field">
        <label htmlFor={`${idPrefix}-file`}>Subir CV en PDF</label>
        <input
          id={`${idPrefix}-file`}
          type="file"
          accept="application/pdf,.pdf"
          disabled={isReadingPdf}
          aria-describedby={`${idPrefix}-file-hint`}
          onChange={handleFile}
        />
        <p className="form-hint" id={`${idPrefix}-file-hint`}>
          Se lee en tu navegador: el archivo no se sube a ningún lado. Hasta 5 MB.
        </p>
      </div>

      <div className="form-field">
        <label htmlFor={draftId}>Texto del CV</label>
        <textarea
          id={draftId}
          rows={8}
          value={draft}
          placeholder="Subí el PDF o pegá acá el texto de tu CV."
          aria-invalid={Boolean(draftError)}
          aria-describedby={draftError ? `${draftId}-hint ${draftId}-error` : `${draftId}-hint`}
          onChange={(event) => {
            setDraft(event.target.value)
            setDraftError(null)
          }}
        />
        <p className="form-hint" id={`${draftId}-hint`}>
          Se guarda en este navegador y, si lo conectaste, en tu Google Drive. También entra en los
          respaldos.
        </p>
        {draftError && (
          <p className="form-error" id={`${draftId}-error`} role="alert">
            {draftError}
          </p>
        )}
      </div>

      <div className="cv-actions">
        <button className="button button-primary" type="button" disabled={!isDirty} onClick={save}>
          Guardar CV
        </button>
        {isAiAvailable && (
          <button
            className="button button-secondary"
            type="button"
            disabled={!cvText || isDirty || isLoading || preview !== null}
            onClick={preparePreview}
          >
            {isLoading ? 'Buscando skills…' : 'Sugerir skills desde el CV'}
          </button>
        )}
      </div>
      {isAiAvailable && isDirty && cvText && (
        <p className="form-hint">Guardá los cambios del CV antes de pedir sugerencias.</p>
      )}

      {preview && (
        <div className="cv-preview" role="region" aria-labelledby={`${idPrefix}-preview-title`}>
          <h4 id={`${idPrefix}-preview-title`}>Esto es lo que se envía a la IA</h4>
          <p className="form-hint">
            {preview.removedCount === 0
              ? 'No encontramos mails, teléfonos, links, DNI ni CUIL para quitar.'
              : `Se quitaron ${preview.removedCount} datos de contacto o identidad (mails, teléfonos, links, DNI o CUIL).`}{' '}
            Tu nombre puede seguir en el texto. Se envía a Groq, un servicio de IA, solo para detectar
            skills.
          </p>
          <pre className="cv-preview-text">{preview.text}</pre>
          <div className="form-actions">
            <button className="button button-secondary" type="button" onClick={() => setPreview(null)}>
              Cancelar
            </button>
            <button className="button button-primary" type="button" onClick={send}>
              Enviar a la IA
            </button>
          </div>
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
  )
}

export default CvPanel
