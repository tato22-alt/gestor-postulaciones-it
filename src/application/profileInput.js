import { SKILL_LIST_LIMITS, normalizeSkill } from '../domain/candidateSkillsPolicy.js'
import { TARGET_ROLE_LIST_LIMITS } from '../domain/jobSearchPreferencesPolicy.js'
import { normalizeListText, validateListTextInput } from '../domain/textListPolicy.js'

export function normalizeSkillInput(value) {
  return normalizeSkill(value)
}

// Returns an error code, or null when the skill can be added to the current list.
export function validateSkillInput(value, currentSkills = []) {
  return validateListTextInput(value, currentSkills, SKILL_LIST_LIMITS)
}

export function normalizeTargetRoleInput(value) {
  return normalizeListText(value)
}

export function validateTargetRoleInput(value, currentRoles = []) {
  return validateListTextInput(value, currentRoles, TARGET_ROLE_LIST_LIMITS)
}
