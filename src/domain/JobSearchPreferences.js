import { generateId } from '../utils/id.js'

class JobSearchPreferences {
  constructor({
    id = generateId(),
    targetRoles = [],
    rolePriorities = {},
    acceptedEmploymentTypes = [],
    preferredModalities = [],
    travelTimeRangeHours = { min: null, max: null },
    hybridAttendancePolicy = {},
    salaryReference = null,
    experienceRequirementPolicy = null,
    advancedEnglishPolicy = null,
    fullTimePolicy = null,
    staleAfterDays = null,
    weeklyOpportunityTarget = { min: null, max: null },
    notificationPreferences = {},
    createdAt = new Date().toISOString(),
    updatedAt = createdAt,
  } = {}) {
    this.id = id
    this.targetRoles = [...targetRoles]
    this.rolePriorities = { ...rolePriorities }
    this.acceptedEmploymentTypes = [...acceptedEmploymentTypes]
    this.preferredModalities = [...preferredModalities]
    this.travelTimeRangeHours = { ...travelTimeRangeHours }
    this.hybridAttendancePolicy = { ...hybridAttendancePolicy }
    this.salaryReference = salaryReference ? { ...salaryReference } : null
    this.experienceRequirementPolicy = experienceRequirementPolicy
    this.advancedEnglishPolicy = advancedEnglishPolicy
    this.fullTimePolicy = fullTimePolicy
    this.staleAfterDays = staleAfterDays
    this.weeklyOpportunityTarget = { ...weeklyOpportunityTarget }
    this.notificationPreferences = { ...notificationPreferences }
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }
}

export default JobSearchPreferences
