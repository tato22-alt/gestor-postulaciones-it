import { canHaveFollowUp, getFollowUpUrgency } from '../domain/followUpPolicy.js'
import { toLocalDateString } from '../utils/date.js'

// Derives the follow-up agenda from the applications. Nothing here is stored: the list,
// its order, and each urgency are recalculated from the source data and the current date.
export default function getPendingFollowUps({ applications, opportunities, now = new Date() }) {
  const today = toLocalDateString(now)
  const opportunitiesById = new Map(opportunities.map((opportunity) => [opportunity.id, opportunity]))

  return applications
    .filter((application) => application.followUpAt && canHaveFollowUp(application.status))
    .map((application) => ({
      application,
      opportunity: opportunitiesById.get(application.opportunityId) ?? null,
      followUpAt: application.followUpAt,
      urgency: getFollowUpUrgency(application.followUpAt, today),
    }))
    .sort((first, second) => first.followUpAt.localeCompare(second.followUpAt))
}
