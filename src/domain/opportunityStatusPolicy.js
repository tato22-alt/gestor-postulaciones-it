import { OPPORTUNITY_STATUSES } from '../constants/domainOptions.js'

const { DETECTED, SAVED, DISMISSED, ARCHIVED } = OPPORTUNITY_STATUSES

export const ALLOWED_TRANSITIONS = Object.freeze({
  [DETECTED.value]:  Object.freeze([SAVED.value, DISMISSED.value, ARCHIVED.value]),
  [SAVED.value]:     Object.freeze([DISMISSED.value, ARCHIVED.value]),
  [DISMISSED.value]: Object.freeze([SAVED.value, ARCHIVED.value]),
  [ARCHIVED.value]:  Object.freeze([DETECTED.value, SAVED.value, DISMISSED.value]),
})

const STATUS_BY_VALUE = Object.freeze(
  Object.fromEntries(Object.values(OPPORTUNITY_STATUSES).map((s) => [s.value, s]))
)

export function canTransitionOpportunityStatus(from, to) {
  if (from === to) return false
  const allowed = ALLOWED_TRANSITIONS[from]
  return Array.isArray(allowed) && allowed.includes(to)
}

export function getAllowedTargetStatuses(currentStatus) {
  const allowedValues = ALLOWED_TRANSITIONS[currentStatus] ?? []
  return allowedValues.map((value) => STATUS_BY_VALUE[value]).filter(Boolean)
}
