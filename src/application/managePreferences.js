import JobSearchPreferences from '../domain/JobSearchPreferences.js'
import { PREFERENCE_OPTION_FIELDS, isPreferenceOptionField } from '../domain/jobSearchPreferencesPolicy.js'
import { getListTextKey, hasListText } from '../domain/textListPolicy.js'
import createNextUpdatedAt from './createNextUpdatedAt.js'
import { normalizeTargetRoleInput, validateTargetRoleInput } from './profileInput.js'

// Returns new preferences with the changes applied, creating them on the first change.
function applyChanges(preferences, changes, now) {
  if (!preferences) {
    return {
      ok: true,
      status: 'created',
      preferences: new JobSearchPreferences({ ...changes, createdAt: new Date(now).toISOString() }),
    }
  }

  return {
    ok: true,
    status: 'updated',
    preferences: new JobSearchPreferences({
      ...preferences,
      ...changes,
      updatedAt: createNextUpdatedAt(preferences.updatedAt, now),
    }),
  }
}

export function addTargetRole(preferences, { role, now = new Date() }) {
  const currentRoles = preferences?.targetRoles ?? []
  const error = validateTargetRoleInput(role, currentRoles)

  if (error) {
    return { ok: false, status: 'invalid_input', error }
  }

  return applyChanges(preferences, { targetRoles: [...currentRoles, normalizeTargetRoleInput(role)] }, now)
}

export function removeTargetRole(preferences, { role, now = new Date() }) {
  if (!preferences || !hasListText(preferences.targetRoles, role)) {
    return { ok: false, status: 'not_found' }
  }

  const key = getListTextKey(role)

  return applyChanges(
    preferences,
    { targetRoles: preferences.targetRoles.filter((current) => getListTextKey(current) !== key) },
    now,
  )
}

// Checks or unchecks one controlled option (a modality or an employment type). The stored
// list always follows the canonical option order, whatever order the user clicked in.
export function setPreferenceOption(preferences, { field, value, isSelected, now = new Date() }) {
  if (!isPreferenceOptionField(field) || !PREFERENCE_OPTION_FIELDS[field].includes(value)) {
    return { ok: false, status: 'invalid_input' }
  }

  const current = preferences?.[field] ?? []

  if (current.includes(value) === isSelected) {
    return { ok: false, status: 'unchanged' }
  }

  const selected = new Set(isSelected ? [...current, value] : current.filter((item) => item !== value))

  return applyChanges(
    preferences,
    { [field]: PREFERENCE_OPTION_FIELDS[field].filter((option) => selected.has(option)) },
    now,
  )
}
