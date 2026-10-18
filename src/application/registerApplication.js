import { APPLICATION_STATUSES } from '../constants/domainOptions.js'
import Application from '../domain/Application.js'
import { getApplicationRegistrationBlocker } from '../domain/applicationRegistrationPolicy.js'
import { getSuggestedFollowUpDate } from '../domain/followUpPolicy.js'

export default function registerApplication(
  opportunities,
  applications,
  { opportunityId, expectedUpdatedAt, now = new Date() } = {},
) {
  if (!Array.isArray(opportunities) || !Array.isArray(applications)) {
    return { ok: false, status: 'invalid_collection' }
  }

  const opportunity = opportunities.find((opp) => opp?.id === opportunityId)

  if (!opportunity) {
    return { ok: false, status: 'not_found' }
  }

  if (opportunity.updatedAt !== expectedUpdatedAt) {
    return { ok: false, status: 'conflict' }
  }

  const blocker = getApplicationRegistrationBlocker(opportunity, applications)

  if (blocker) {
    return { ok: false, status: blocker }
  }

  const appliedTime = new Date(now)

  if (Number.isNaN(appliedTime.getTime())) {
    return { ok: false, status: 'invalid_timestamp' }
  }

  const application = new Application({
    opportunityId: opportunity.id,
    appliedAt: appliedTime.toISOString(),
    followUpAt: getSuggestedFollowUpDate(APPLICATION_STATUSES.APPLIED.value, appliedTime),
  })

  return {
    ok: true,
    status: 'registered',
    application,
    applications: [...applications, application],
  }
}
