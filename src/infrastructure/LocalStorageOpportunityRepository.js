import {
  EMPLOYMENT_TYPES,
  MODALITIES,
  OPPORTUNITY_STATUSES,
  SALARY_PERIODS,
} from '../constants/domainOptions.js'
import JobOpportunity from '../domain/JobOpportunity.js'
import { isValidHttpUrl } from '../utils/url.js'

export const OPPORTUNITY_STORAGE_KEY = 'it-job-search-assistant.opportunities'

const SCHEMA_VERSION = 1

const OPPORTUNITY_FIELDS = [
  'id',
  'sourceId',
  'company',
  'title',
  'description',
  'url',
  'location',
  'modality',
  'employmentType',
  'requiredExperience',
  'requiredSkills',
  'preferredSkills',
  'languageRequirements',
  'salary',
  'publishedAt',
  'detectedAt',
  'status',
  'createdAt',
  'updatedAt',
]

const SALARY_FIELDS = ['amount', 'currency', 'period', 'condition']

function getControlledValues(options) {
  return new Set(Object.values(options).map((option) => option.value))
}

const VALID_MODALITIES = getControlledValues(MODALITIES)
const VALID_EMPLOYMENT_TYPES = getControlledValues(EMPLOYMENT_TYPES)
const VALID_OPPORTUNITY_STATUSES = getControlledValues(OPPORTUNITY_STATUSES)
const VALID_SALARY_PERIODS = getControlledValues(SALARY_PERIODS)

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }

  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function hasExactFields(value, fields) {
  const keys = Object.keys(value)
  return keys.length === fields.length && fields.every((field) => Object.hasOwn(value, field))
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function isNullableNonEmptyString(value) {
  return value === null || isNonEmptyString(value)
}

function isStringArray(value) {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string')
}

function isValidTimestamp(value) {
  if (typeof value !== 'string') {
    return false
  }

  const isoTimestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
  const parsedTimestamp = new Date(value)

  return (
    isoTimestampPattern.test(value) &&
    !Number.isNaN(parsedTimestamp.getTime()) &&
    parsedTimestamp.toISOString() === value
  )
}

function isValidPublishedDate(value) {
  if (value === null) {
    return true
  }

  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const parsedDate = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === value
}

function isJsonCompatible(value, depth = 0, visited = new Set()) {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value))
  ) {
    return true
  }

  if (depth >= 10 || typeof value !== 'object' || visited.has(value)) {
    return false
  }

  visited.add(value)

  const entries = Array.isArray(value) ? value : Object.values(value)
  const isCompatible =
    (Array.isArray(value) || isPlainObject(value)) &&
    entries.every((entry) => isJsonCompatible(entry, depth + 1, visited))

  visited.delete(value)
  return isCompatible
}

function isValidSalary(value) {
  if (value === null) {
    return true
  }

  if (!isPlainObject(value) || Object.keys(value).some((key) => !SALARY_FIELDS.includes(key))) {
    return false
  }

  const { amount, currency, period, condition } = value

  return (
    (amount === undefined ||
      amount === null ||
      (typeof amount === 'number' && Number.isFinite(amount))) &&
    (currency === undefined || currency === null || isNonEmptyString(currency)) &&
    (period === undefined || period === null || VALID_SALARY_PERIODS.has(period)) &&
    (condition === undefined || condition === null || isNonEmptyString(condition))
  )
}

function isValidStoredOpportunity(value) {
  return (
    isPlainObject(value) &&
    hasExactFields(value, OPPORTUNITY_FIELDS) &&
    isNonEmptyString(value.id) &&
    isNullableNonEmptyString(value.sourceId) &&
    isNonEmptyString(value.company) &&
    isNonEmptyString(value.title) &&
    typeof value.description === 'string' &&
    isValidHttpUrl(value.url) &&
    typeof value.location === 'string' &&
    (value.modality === null || VALID_MODALITIES.has(value.modality)) &&
    (value.employmentType === null || VALID_EMPLOYMENT_TYPES.has(value.employmentType)) &&
    isJsonCompatible(value.requiredExperience) &&
    isStringArray(value.requiredSkills) &&
    isStringArray(value.preferredSkills) &&
    isStringArray(value.languageRequirements) &&
    isValidSalary(value.salary) &&
    isValidPublishedDate(value.publishedAt) &&
    isValidTimestamp(value.detectedAt) &&
    VALID_OPPORTUNITY_STATUSES.has(value.status) &&
    isValidTimestamp(value.createdAt) &&
    isValidTimestamp(value.updatedAt)
  )
}

function serializeOpportunity(opportunity) {
  return {
    id: opportunity.id,
    sourceId: opportunity.sourceId,
    company: opportunity.company,
    title: opportunity.title,
    description: opportunity.description,
    url: opportunity.url,
    location: opportunity.location,
    modality: opportunity.modality,
    employmentType: opportunity.employmentType,
    requiredExperience: opportunity.requiredExperience,
    requiredSkills: [...opportunity.requiredSkills],
    preferredSkills: [...opportunity.preferredSkills],
    languageRequirements: [...opportunity.languageRequirements],
    salary: opportunity.salary ? { ...opportunity.salary } : null,
    publishedAt: opportunity.publishedAt,
    detectedAt: opportunity.detectedAt,
    status: opportunity.status,
    createdAt: opportunity.createdAt,
    updatedAt: opportunity.updatedAt,
  }
}

class LocalStorageOpportunityRepository {
  constructor(storage) {
    this.storage = storage
    this.isPersistenceBlocked = false
  }

  loadAll() {
    if (!this.storage) {
      return this.blockPersistence('unavailable')
    }

    let rawValue

    try {
      rawValue = this.storage.getItem(OPPORTUNITY_STORAGE_KEY)
    } catch {
      return this.blockPersistence('read_failure')
    }

    if (rawValue === null || rawValue === undefined) {
      return { ok: true, status: 'empty', opportunities: [] }
    }

    let envelope

    try {
      envelope = JSON.parse(rawValue)
    } catch {
      return this.blockPersistence('corrupted')
    }

    if (!isPlainObject(envelope) || !Object.hasOwn(envelope, 'schemaVersion')) {
      return this.blockPersistence('corrupted')
    }

    if (envelope.schemaVersion !== SCHEMA_VERSION) {
      return this.blockPersistence('unsupported_version')
    }

    if (!Array.isArray(envelope.opportunities)) {
      return this.blockPersistence('corrupted')
    }

    if (!envelope.opportunities.every(isValidStoredOpportunity)) {
      return this.blockPersistence('corrupted')
    }

    const opportunities = envelope.opportunities.map(
      (opportunity) => new JobOpportunity(opportunity),
    )

    return {
      ok: true,
      status: opportunities.length === 0 ? 'empty' : 'loaded',
      opportunities,
    }
  }

  saveAll(opportunities) {
    if (this.isPersistenceBlocked) {
      return { ok: false, status: 'blocked' }
    }

    if (!this.storage) {
      return { ok: false, status: 'unavailable' }
    }

    if (!Array.isArray(opportunities)) {
      return { ok: false, status: 'invalid_data' }
    }

    let serializedOpportunities

    try {
      serializedOpportunities = opportunities.map(serializeOpportunity)
    } catch {
      return { ok: false, status: 'invalid_data' }
    }

    if (!serializedOpportunities.every(isValidStoredOpportunity)) {
      return { ok: false, status: 'invalid_data' }
    }

    const envelope = {
      schemaVersion: SCHEMA_VERSION,
      opportunities: serializedOpportunities,
    }

    try {
      this.storage.setItem(OPPORTUNITY_STORAGE_KEY, JSON.stringify(envelope))
      return { ok: true, status: 'saved' }
    } catch {
      return { ok: false, status: 'write_failure' }
    }
  }

  blockPersistence(status) {
    this.isPersistenceBlocked = true
    return { ok: false, status, opportunities: [] }
  }
}

export default LocalStorageOpportunityRepository
