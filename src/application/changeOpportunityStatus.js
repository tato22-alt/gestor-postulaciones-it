import JobOpportunity from '../domain/JobOpportunity.js'
import { canTransitionOpportunityStatus } from '../domain/opportunityStatusPolicy.js'

function createNextUpdatedAt(currentUpdatedAt, now) {
  const currentTime = new Date(currentUpdatedAt).getTime()
  const requestedTime = new Date(now).getTime()

  if (Number.isNaN(currentTime) || Number.isNaN(requestedTime)) {
    return null
  }

  return new Date(Math.max(requestedTime, currentTime + 1)).toISOString()
}

export default function changeOpportunityStatus(
  opportunity,
  { nextStatus, expectedUpdatedAt, now = new Date() } = {},
) {
  if (!opportunity || typeof opportunity !== 'object') {
    return { ok: false, status: 'invalid_opportunity' }
  }

  if (opportunity.updatedAt !== expectedUpdatedAt) {
    return { ok: false, status: 'conflict' }
  }

  if (!canTransitionOpportunityStatus(opportunity.status, nextStatus)) {
    return { ok: false, status: 'invalid_transition' }
  }

  const updatedAt = createNextUpdatedAt(opportunity.updatedAt, now)

  if (updatedAt === null) {
    return { ok: false, status: 'invalid_timestamp' }
  }

  const updatedOpportunity = new JobOpportunity({
    ...opportunity,
    status: nextStatus,
    updatedAt,
  })

  return {
    ok: true,
    status: 'updated',
    opportunity: updatedOpportunity,
  }
}
