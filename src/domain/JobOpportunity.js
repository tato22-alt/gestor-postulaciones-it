import { OPPORTUNITY_STATUSES } from '../constants/domainOptions.js'

class JobOpportunity {
  constructor({
    id = crypto.randomUUID(),
    sourceId = null,
    company = '',
    title = '',
    description = '',
    url = '',
    location = '',
    modality = null,
    employmentType = null,
    requiredExperience = null,
    requiredSkills = [],
    preferredSkills = [],
    languageRequirements = [],
    salary = null,
    publishedAt = null,
    detectedAt = new Date().toISOString(),
    status = OPPORTUNITY_STATUSES.DETECTED.value,
    createdAt = detectedAt,
    updatedAt = createdAt,
  } = {}) {
    this.id = id
    this.sourceId = sourceId
    this.company = company
    this.title = title
    this.description = description
    this.url = url
    this.location = location
    this.modality = modality
    this.employmentType = employmentType
    this.requiredExperience = requiredExperience
    this.requiredSkills = [...requiredSkills]
    this.preferredSkills = [...preferredSkills]
    this.languageRequirements = [...languageRequirements]
    this.salary = salary ? { ...salary } : null
    this.publishedAt = publishedAt
    this.detectedAt = detectedAt
    this.status = status
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }
}

export default JobOpportunity
