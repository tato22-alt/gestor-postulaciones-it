import { EMPLOYMENT_TYPES, MODALITIES } from '../constants/domainOptions.js'
import { MATCH_ITEM_TYPES } from '../domain/compatibilityPolicy.js'

function getOptionLabel(options, value) {
  return Object.values(options).find((option) => option.value === value)?.label ?? value
}

const ITEM_LABELS = {
  [MATCH_ITEM_TYPES.SKILLS_MENTIONED]: (values) => `Menciona tus skills: ${values.join(', ')}.`,
  [MATCH_ITEM_TYPES.SKILLS_NOT_MENTIONED]: () => 'La publicación no menciona ninguna de tus skills.',
  [MATCH_ITEM_TYPES.NO_TEXT_FOR_SKILLS]: () => 'No hay descripción para comparar tus skills.',
  [MATCH_ITEM_TYPES.ROLE_MATCHED]: (values) => `El puesto coincide con tu rol buscado: ${values.join(', ')}.`,
  [MATCH_ITEM_TYPES.ROLE_NOT_MATCHED]: () => 'El título no contiene ninguno de tus roles buscados.',
  [MATCH_ITEM_TYPES.MODALITY_PREFERRED]: ([value]) => `Modalidad preferida: ${getOptionLabel(MODALITIES, value)}.`,
  [MATCH_ITEM_TYPES.MODALITY_NOT_PREFERRED]: ([value]) =>
    `La modalidad (${getOptionLabel(MODALITIES, value)}) no está entre tus preferidas.`,
  [MATCH_ITEM_TYPES.MODALITY_UNKNOWN]: () => 'La oportunidad no indica la modalidad.',
  [MATCH_ITEM_TYPES.EMPLOYMENT_TYPE_ACCEPTED]: ([value]) =>
    `Jornada aceptada: ${getOptionLabel(EMPLOYMENT_TYPES, value)}.`,
  [MATCH_ITEM_TYPES.EMPLOYMENT_TYPE_NOT_ACCEPTED]: ([value]) =>
    `La jornada (${getOptionLabel(EMPLOYMENT_TYPES, value)}) no está entre las que aceptás.`,
  [MATCH_ITEM_TYPES.EMPLOYMENT_TYPE_UNKNOWN]: () => 'La oportunidad no indica la jornada.',
}

const GROUPS = [
  { key: 'strengths', title: 'Coincide', className: 'compatibility-group--strengths' },
  { key: 'warnings', title: 'A revisar', className: 'compatibility-group--warnings' },
  { key: 'unknowns', title: 'Sin datos para comparar', className: 'compatibility-group--unknowns' },
]

function pluralize(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`
}

// Explains a MatchResult. It never decides anything: warnings are not rejections, and the
// user still decides whether to apply.
function CompatibilitySummary({ result }) {
  const summary = [
    pluralize(result.strengths.length, 'coincidencia', 'coincidencias'),
    pluralize(result.warnings.length, 'a revisar', 'a revisar'),
    pluralize(result.unknowns.length, 'sin datos', 'sin datos'),
  ].join(' · ')

  return (
    <details className="compatibility">
      <summary>
        <span className="compatibility-title">Compatibilidad</span>{' '}
        <span className="compatibility-counts">{summary}</span>
      </summary>
      <div className="compatibility-body">
        {GROUPS.filter(({ key }) => result[key].length > 0).map(({ key, title, className }) => (
          <div key={key} className={`compatibility-group ${className}`}>
            <h4>{title}</h4>
            <ul>
              {result[key].map((item) => (
                <li key={item.type}>{ITEM_LABELS[item.type](item.values ?? [])}</li>
              ))}
            </ul>
          </div>
        ))}
        <p className="form-hint">
          Comparación por texto con tu perfil y tus preferencias. Es orientativa: no descarta
          ofertas ni decide por vos.
        </p>
      </div>
    </details>
  )
}

export default CompatibilitySummary
