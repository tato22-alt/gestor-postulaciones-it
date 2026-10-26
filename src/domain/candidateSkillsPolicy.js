// Rules for the skills of a CandidateProfile. Skills are free text written by the user;
// two skills that differ only in case, accents, or spacing are the same skill.
import { getListTextKey, hasListText, isValidTextList, normalizeListText } from './textListPolicy.js'

export const SKILL_MAX_LENGTH = 60
export const SKILLS_MAX_COUNT = 100

export const SKILL_LIST_LIMITS = Object.freeze({
  maxLength: SKILL_MAX_LENGTH,
  maxCount: SKILLS_MAX_COUNT,
})

export const normalizeSkill = normalizeListText
export const getSkillKey = getListTextKey
export const hasSkill = hasListText

export function isValidSkillList(skills) {
  return isValidTextList(skills, SKILL_LIST_LIMITS)
}
