import { SOURCE_STATUSES } from '../constants/domainOptions.js'
import { generateId } from '../utils/id.js'

export const SOURCE_COMPANY_NAME_MAX_LENGTH = 200

class CompanySource {
  constructor({
    id = generateId(),
    companyName = '',
    careersUrl = '',
    status = SOURCE_STATUSES.PENDING.value,
    discoveredAt = new Date().toISOString(),
    approvedAt = null,
    lastCheckedAt = null,
    createdAt = discoveredAt,
    updatedAt = createdAt,
  } = {}) {
    this.id = id
    this.companyName = companyName
    this.careersUrl = careersUrl
    this.status = status
    this.discoveredAt = discoveredAt
    this.approvedAt = approvedAt
    this.lastCheckedAt = lastCheckedAt
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }
}

export default CompanySource
