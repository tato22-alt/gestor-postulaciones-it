import { APPLICATION_STATUSES } from '../constants/domainOptions.js'

class Application {
  constructor({
    id = crypto.randomUUID(),
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
