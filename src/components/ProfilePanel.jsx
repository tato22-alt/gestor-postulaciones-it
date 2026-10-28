import { validateSkillInput, validateTargetRoleInput } from '../application/profileInput.js'
import { EMPLOYMENT_TYPES, MODALITIES } from '../constants/domainOptions.js'
import { SKILLS_MAX_COUNT, SKILL_MAX_LENGTH } from '../domain/candidateSkillsPolicy.js'
import { TARGET_ROLES_MAX_COUNT, TARGET_ROLE_MAX_LENGTH } from '../domain/jobSearchPreferencesPolicy.js'
import CvPanel from './CvPanel.jsx'
import TextListEditor from './TextListEditor.jsx'

const SKILL_ERROR_MESSAGES = {
  required: 'Ingresá una skill.',
  too_long: `Usá como máximo ${SKILL_MAX_LENGTH} caracteres.`,
  duplicate: 'Esa skill ya está en tu perfil.',
  too_many: `Podés cargar hasta ${SKILLS_MAX_COUNT} skills.`,
}

const ROLE_ERROR_MESSAGES = {
  required: 'Ingresá un rol.',
  too_long: `Usá como máximo ${TARGET_ROLE_MAX_LENGTH} caracteres.`,
  duplicate: 'Ese rol ya está en tus preferencias.',
  too_many: `Podés cargar hasta ${TARGET_ROLES_MAX_COUNT} roles.`,
}

const SKILL_HINT = 'Una por vez. Mayúsculas y acentos no cuentan como diferencia.'
const ROLE_HINT = 'Uno por vez. Mayúsculas y acentos no cuentan como diferencia.'

const OPTION_GROUPS = [
  { field: 'preferredModalities', legend: 'Modalidades preferidas', options: Object.values(MODALITIES) },
  { field: 'acceptedEmploymentTypes', legend: 'Tipos de jornada aceptados', options: Object.values(EMPLOYMENT_TYPES) },
]

function ProfilePanel({
  skills,
  cvText,
  preferences,
  isAiAvailable,
  readPdf,
  onAddSkill,
  onRemoveSkill,
  onAddSkills,
  onSaveCv,
  onSuggestFromCv,
  onAddTargetRole,
  onRemoveTargetRole,
  onSetPreferenceOption,
}) {
  return (
    <>
      <section className="panel" aria-labelledby="profile-title">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Perfil</p>
            <h2 id="profile-title">Perfil profesional</h2>
          </div>
          <p>
            Cargá tus skills a mano o a partir de tu CV. Se usan para mostrar la compatibilidad
            de cada oportunidad.
          </p>
        </div>

        <TextListEditor
          label="Skill"
          placeholder="Ej.: React, SQL Server, Git"
          hint={SKILL_HINT}
          maxLength={SKILL_MAX_LENGTH}
          values={skills}
          validate={validateSkillInput}
          errorMessages={SKILL_ERROR_MESSAGES}
          addLabel="Agregar skill"
          getRemoveLabel={(skill) => `Quitar skill: ${skill}`}
          countLabel={(count) => (count === 1 ? '1 skill' : `${count} skills`)}
          emptyTitle="Todavía no cargaste skills."
          emptyText="Agregá las tecnologías y herramientas que sabés usar."
          onAdd={onAddSkill}
          onRemove={onRemoveSkill}
        />

        <CvPanel
          key={cvText}
          cvText={cvText}
          skills={skills}
          isAiAvailable={isAiAvailable}
          readPdf={readPdf}
          onSaveCv={onSaveCv}
          onSuggestFromCv={onSuggestFromCv}
          onAddSkills={onAddSkills}
        />
      </section>

      <section className="panel" aria-labelledby="preferences-title">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Búsqueda</p>
            <h2 id="preferences-title">Preferencias de búsqueda</h2>
          </div>
          <p>Qué tipo de trabajo buscás. Se usan para mostrar la compatibilidad de cada oportunidad.</p>
        </div>

        <TextListEditor
          label="Rol buscado"
          placeholder="Ej.: Desarrollador trainee"
          hint={ROLE_HINT}
          maxLength={TARGET_ROLE_MAX_LENGTH}
          values={preferences.targetRoles}
          validate={validateTargetRoleInput}
          errorMessages={ROLE_ERROR_MESSAGES}
          addLabel="Agregar rol"
          getRemoveLabel={(role) => `Quitar rol: ${role}`}
          countLabel={(count) => (count === 1 ? '1 rol' : `${count} roles`)}
          emptyTitle="Todavía no cargaste roles."
          emptyText="Agregá los puestos a los que te querés postular."
          onAdd={onAddTargetRole}
          onRemove={onRemoveTargetRole}
        />

        <div className="preference-option-groups">
          {OPTION_GROUPS.map(({ field, legend, options }) => (
            <fieldset key={field} className="preference-option-group">
              <legend>{legend}</legend>
              <p className="form-hint">Elegí las que quieras. Sin ninguna marcada, no hay preferencia.</p>
              {options.map((option) => (
                <label key={option.value} className="preference-option">
                  <input
                    type="checkbox"
                    checked={preferences[field].includes(option.value)}
                    onChange={(event) => onSetPreferenceOption(field, option.value, event.target.checked)}
                  />
                  {option.label}
                </label>
              ))}
            </fieldset>
          ))}
        </div>
      </section>
    </>
  )
}

export default ProfilePanel
