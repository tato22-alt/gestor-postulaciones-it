import { APPLICATION_STATUSES } from '../constants/domainOptions.js'
import { generateId } from '../utils/id.js'

// Size limits keep free text reviewable and protect browser storage from oversized values.
export const APPLICATION_NEXT_ACTION_MAX_LENGTH = 200
export const APPLICATION_NOTES_MAX_LENGTH = 2000

class Application {
  constructor({
    id = generateId(),
    opportunityId = null,
    appliedAt = new Date().toISOString(),
    status = APPLICATION_STATUSES.APPLIED.value,
    followUpAt = null,
    nextAction = '',
    notes = '',
    createdAt = appliedAt,
    updatedAt = createdAt,
  } = {}) {
    this.id = id
    this.opportunityId = opportunityId
    this.appliedAt = appliedAt
    this.status = status
    this.followUpAt = followUpAt
    this.nextAction = nextAction
    this.notes = notes
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }
}

export default Application
