import { SOURCE_STATUSES } from '../constants/domainOptions.js'
import CompanySource, { SOURCE_COMPANY_NAME_MAX_LENGTH } from '../domain/CompanySource.js'
import { isValidHttpUrl } from '../utils/url.js'
import {
  hasExactFields,
  isNonEmptyString,
  isPlainObject,
  isValidTimestamp,
} from './storageValidation.js'

export const SOURCE_STORAGE_KEY = 'it-job-search-assistant.sources'

const SCHEMA_VERSION = 1

const SOURCE_FIELDS = [
  'id',
  'companyName',
  'careersUrl',
  'status',
  'discoveredAt',
  'approvedAt',
  'lastCheckedAt',
  'createdAt',
  'updatedAt',
]

const VALID_SOURCE_STATUSES = new Set(
  Object.values(SOURCE_STATUSES).map((status) => status.value),
)

const isNullableTimestamp = (value) => value === null || isValidTimestamp(value)

export function isValidStoredSource(value) {
  return (
    isPlainObject(value) &&
    hasExactFields(value, SOURCE_FIELDS) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.companyName) &&
    value.companyName.length <= SOURCE_COMPANY_NAME_MAX_LENGTH &&
    isValidHttpUrl(value.careersUrl) &&
    VALID_SOURCE_STATUSES.has(value.status) &&
    isValidTimestamp(value.discoveredAt) &&
    isNullableTimestamp(value.approvedAt) &&
    isNullableTimestamp(value.lastCheckedAt) &&
    isValidTimestamp(value.createdAt) &&
    isValidTimestamp(value.updatedAt)
  )
}

export function hasUniqueSourceIds(records) {
  return new Set(records.map((record) => record.id)).size === records.length
}

export function serializeSource(source) {
  return {
    id: source.id,
    companyName: source.companyName,
    careersUrl: source.careersUrl,
    status: source.status,
    discoveredAt: source.discoveredAt,
    approvedAt: source.approvedAt,
    lastCheckedAt: source.lastCheckedAt,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  }
}

class LocalStorageSourceRepository {
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
      rawValue = this.storage.getItem(SOURCE_STORAGE_KEY)
    } catch {
      return this.blockPersistence('read_failure')
    }

    if (rawValue === null || rawValue === undefined) {
      return this.completeLoad('empty', [])
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

    if (
      !Array.isArray(envelope.sources) ||
      !envelope.sources.every(isValidStoredSource) ||
      !hasUniqueSourceIds(envelope.sources)
    ) {
      return this.blockPersistence('corrupted')
    }

    const sources = envelope.sources.map((source) => new CompanySource(source))

    return this.completeLoad(sources.length === 0 ? 'empty' : 'loaded', sources)
  }

  saveAll(sources) {
    if (this.isPersistenceBlocked) {
      return { ok: false, status: 'blocked' }
    }

    if (!this.storage) {
      return { ok: false, status: 'unavailable' }
    }

    if (!Array.isArray(sources)) {
      return { ok: false, status: 'invalid_data' }
    }

    let serializedSources

    try {
      serializedSources = sources.map(serializeSource)
    } catch {
      return { ok: false, status: 'invalid_data' }
    }

    if (!serializedSources.every(isValidStoredSource) || !hasUniqueSourceIds(serializedSources)) {
      return { ok: false, status: 'invalid_data' }
    }

    try {
      this.storage.setItem(
        SOURCE_STORAGE_KEY,
        JSON.stringify({ schemaVersion: SCHEMA_VERSION, sources: serializedSources }),
      )
      return { ok: true, status: 'saved' }
    } catch {
      return { ok: false, status: 'write_failure' }
    }
  }

  // Returns the stored text exactly as it is, so the user can keep a copy of data that
  // could not be loaded. Never parses, repairs, or deletes it.
  readRawValue() {
    try {
      return this.storage?.getItem(SOURCE_STORAGE_KEY) ?? null
    } catch {
      return null
    }
  }

  blockPersistence(status) {
    this.isPersistenceBlocked = true
    return { ok: false, status, sources: [] }
  }

  completeLoad(status, sources) {
    this.isPersistenceBlocked = false
    return { ok: true, status, sources }
  }
}

export default LocalStorageSourceRepository
