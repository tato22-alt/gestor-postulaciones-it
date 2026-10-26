// Rules for the skills of a CandidateProfile. Skills are free text written by the user;
// two skills that differ only in case, accents, or spacing are the same skill.

export const SKILL_MAX_LENGTH = 60
export const SKILLS_MAX_COUNT = 100

const COMBINING_DIACRITICAL_MARKS = /[̀-ͯ]/g

// Trims and collapses inner whitespace, keeping the text the user wrote.
export function normalizeSkill(value) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : ''
}

// Comparison key: "Gestión de Proyectos" and "gestion  de proyectos" are the same skill.
export function getSkillKey(value) {
  return normalizeSkill(value)
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(COMBINING_DIACRITICAL_MARKS, '')
}

export function hasSkill(skills, value) {
  const key = getSkillKey(value)
  return skills.some((skill) => getSkillKey(skill) === key)
}

export function isValidSkillList(skills) {
  return (
    Array.isArray(skills) &&
    skills.length <= SKILLS_MAX_COUNT &&
    skills.every(
      (skill) =>
        typeof skill === 'string' &&
        skill === normalizeSkill(skill) &&
        skill.length > 0 &&
        skill.length <= SKILL_MAX_LENGTH,
    ) &&
    new Set(skills.map(getSkillKey)).size === skills.length
  )
}
