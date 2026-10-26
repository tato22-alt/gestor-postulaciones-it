// Rules for the editable JobSearchPreferences fields. Modalities and employment types reuse
// the controlled values of job opportunities, so they can be compared later.
import { EMPLOYMENT_TYPES, MODALITIES } from '../constants/domainOptions.js'
import { isValidTextList } from './textListPolicy.js'

export const TARGET_ROLE_MAX_LENGTH = 80
export const TARGET_ROLES_MAX_COUNT = 20

export const TARGET_ROLE_LIST_LIMITS = Object.freeze({
  maxLength: TARGET_ROLE_MAX_LENGTH,
  maxCount: TARGET_ROLES_MAX_COUNT,
})

// Editable option fields and the controlled values each one accepts.
export const PREFERENCE_OPTION_FIELDS = Object.freeze({
  preferredModalities: Object.values(MODALITIES).map((option) => option.value),
  acceptedEmploymentTypes: Object.values(EMPLOYMENT_TYPES).map((option) => option.value),
})

export function isPreferenceOptionField(field) {
  return Object.hasOwn(PREFERENCE_OPTION_FIELDS, field)
}

// Unique known values, in the canonical order of the option list.
export function isValidPreferenceOptions(field, values) {
  if (!isPreferenceOptionField(field) || !Array.isArray(values)) return false

  const allowed = PREFERENCE_OPTION_FIELDS[field]
  const indexes = values.map((value) => allowed.indexOf(value))

  return indexes.every((index, position) => index >= 0 && (position === 0 || index > indexes[position - 1]))
}

export function isValidTargetRoleList(roles) {
  return isValidTextList(roles, TARGET_ROLE_LIST_LIMITS)
}
