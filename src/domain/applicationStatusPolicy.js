import { APPLICATION_STATUSES } from '../constants/domainOptions.js'

const { APPLIED, INTERVIEW, TECHNICAL_TEST, REJECTED, OFFER } = APPLICATION_STATUSES

export const ALLOWED_APPLICATION_TRANSITIONS = Object.freeze({
  [APPLIED.value]:        Object.freeze([INTERVIEW.value, TECHNICAL_TEST.value, REJECTED.value]),
  [INTERVIEW.value]:      Object.freeze([TECHNICAL_TEST.value, OFFER.value, REJECTED.value]),
  [TECHNICAL_TEST.value]: Object.freeze([INTERVIEW.value, OFFER.value, REJECTED.value]),
  [OFFER.value]:          Object.freeze([]),
  [REJECTED.value]:       Object.freeze([]),
})

const STATUS_BY_VALUE = Object.freeze(
  Object.fromEntries(Object.values(APPLICATION_STATUSES).map((s) => [s.value, s]))
)

export function canTransitionApplicationStatus(from, to) {
  if (from === to) return false
  const allowed = ALLOWED_APPLICATION_TRANSITIONS[from]
  return Array.isArray(allowed) && allowed.includes(to)
}

export function getAllowedApplicationTargetStatuses(currentStatus) {
  const allowedValues = ALLOWED_APPLICATION_TRANSITIONS[currentStatus] ?? []
  return allowedValues.map((value) => STATUS_BY_VALUE[value]).filter(Boolean)
}

// A final status has no outgoing transitions, so a change into it cannot be undone.
export function isFinalApplicationStatus(status) {
  const allowed = ALLOWED_APPLICATION_TRANSITIONS[status]
  return Array.isArray(allowed) && allowed.length === 0
}
