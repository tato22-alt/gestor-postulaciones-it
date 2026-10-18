import { OPPORTUNITY_STATUSES } from '../constants/domainOptions.js'

// Only opportunities that are still under consideration can become an application.
const REGISTRABLE_OPPORTUNITY_STATUSES = new Set([
  OPPORTUNITY_STATUSES.DETECTED.value,
  OPPORTUNITY_STATUSES.SAVED.value,
])

export function findApplicationForOpportunity(applications, opportunityId) {
  if (!Array.isArray(applications)) {
    return null
  }

  return applications.find((application) => application?.opportunityId === opportunityId) ?? null
}

// Returns null when the opportunity can be registered as an application,
// or a stable reason code explaining why it cannot.
export function getApplicationRegistrationBlocker(opportunity, applications) {
  if (!opportunity || typeof opportunity !== 'object') {
    return 'invalid_opportunity'
  }

  if (findApplicationForOpportunity(applications, opportunity.id)) {
    return 'already_applied'
  }

  if (!REGISTRABLE_OPPORTUNITY_STATUSES.has(opportunity.status)) {
    return 'opportunity_status_not_allowed'
  }

  return null
}
