import { APPLICATION_STATUSES } from '../constants/domainOptions.js'
import { addDaysToDateString, toLocalDateString } from '../utils/date.js'

const { APPLIED, INTERVIEW, TECHNICAL_TEST } = APPLICATION_STATUSES

// Suggested delays approved by Luciano. Statuses without an entry (offer, rejected)
// do not get a follow-up. The suggestion is always editable by the user.
export const FOLLOW_UP_DELAY_DAYS = Object.freeze({
  [APPLIED.value]: 7,
  [INTERVIEW.value]: 3,
  [TECHNICAL_TEST.value]: 5,
})

export function canHaveFollowUp(status) {
  return Object.hasOwn(FOLLOW_UP_DELAY_DAYS, status)
}

// Returns the suggested follow-up calendar date ('YYYY-MM-DD') for a status, counted from
// the local calendar day of `from`, or null when the status does not need a follow-up.
export function getSuggestedFollowUpDate(status, from) {
  if (!canHaveFollowUp(status)) {
    return null
  }

  const startDate = toLocalDateString(from)

  return startDate === null ? null : addDaysToDateString(startDate, FOLLOW_UP_DELAY_DAYS[status])
}

export const FOLLOW_UP_URGENCY = Object.freeze({
  OVERDUE: 'overdue',
  TODAY: 'today',
  UPCOMING: 'upcoming',
})

// Dates are 'YYYY-MM-DD' strings, so lexical comparison matches calendar order.
export function getFollowUpUrgency(followUpAt, todayDateString) {
  if (followUpAt < todayDateString) return FOLLOW_UP_URGENCY.OVERDUE
  if (followUpAt === todayDateString) return FOLLOW_UP_URGENCY.TODAY
  return FOLLOW_UP_URGENCY.UPCOMING
}
