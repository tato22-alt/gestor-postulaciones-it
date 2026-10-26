import {
  SKILLS_MAX_COUNT,
  SKILL_MAX_LENGTH,
  hasSkill,
  normalizeSkill,
} from '../domain/candidateSkillsPolicy.js'

export function normalizeSkillInput(value) {
  return normalizeSkill(value)
}

// Returns an error code, or null when the skill can be added to the current list.
export function validateSkillInput(value, currentSkills = []) {
  const skill = normalizeSkill(value)

  if (!skill) return 'required'
  if (skill.length > SKILL_MAX_LENGTH) return 'too_long'
  if (hasSkill(currentSkills, skill)) return 'duplicate'
  if (currentSkills.length >= SKILLS_MAX_COUNT) return 'too_many'

  return null
}
