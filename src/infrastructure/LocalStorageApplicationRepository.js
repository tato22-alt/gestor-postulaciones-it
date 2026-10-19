import { APPLICATION_STATUSES } from '../constants/domainOptions.js'
import Application, {
  APPLICATION_NEXT_ACTION_MAX_LENGTH,
  APPLICATION_NOTES_MAX_LENGTH,
} from '../domain/Application.js'
import { isValidDateString } from '../utils/date.js'
import {
  hasExactFields,
  isNonEmptyString,
  isPlainObject,
  isValidTimestamp,
} from './storageValidation.js'

export const APPLICATION_STORAGE_KEY = 'it-job-search-assistant.applications'

const SCHEMA_VERSION = 1

const APPLICATION_FIELDS = [
  'id',
  'opportunityId',
  'appliedAt',
  'status',
  'followUpAt',
  'nextAction',
  'notes',
  'createdAt',
  'updatedAt',
]

const VALID_APPLICATION_STATUSES = new Set(
  Object.values(APPLICATION_STATUSES).map((status) => status.value),
)

export function isValidStoredApplication(value) {
  return (
    isPlainObject(value) &&
    hasExactFields(value, APPLICATION_FIELDS) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.opportunityId) &&
    isValidTimestamp(value.appliedAt) &&
    VALID_APPLICATION_STATUSES.has(value.status) &&
    (value.followUpAt === null || isValidDateString(value.followUpAt)) &&
    typeof value.nextAction === 'string' &&
    value.nextAction.length <= APPLICATION_NEXT_ACTION_MAX_LENGTH &&
    typeof value.notes === 'string' &&
    value.notes.length <= APPLICATION_NOTES_MAX_LENGTH &&
    isValidTimestamp(value.createdAt) &&
    isValidTimestamp(value.updatedAt)
  )
}

// Each application identifier and each referenced opportunity must appear only once:
// the domain allows at most one application per opportunity.
export function hasUniqueApplicationIdentities(records) {
  const ids = new Set(records.map((record) => record.id))
  const opportunityIds = new Set(records.map((record) => record.opportunityId))

  return ids.size === records.length && opportunityIds.size === records.length
}

export function serializeApplication(application) {
  return {
    id: application.id,
    opportunityId: application.opportunityId,
    appliedAt: application.appliedAt,
    status: application.status,
    followUpAt: application.followUpAt,
    nextAction: application.nextAction,
    notes: application.notes,
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
  }
}

class LocalStorageApplicationRepository {
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
      rawValue = this.storage.getItem(APPLICATION_STORAGE_KEY)
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
      !Array.isArray(envelope.applications) ||
      !envelope.applications.every(isValidStoredApplication) ||
      !hasUniqueApplicationIdentities(envelope.applications)
    ) {
      return this.blockPersistence('corrupted')
    }

    const applications = envelope.applications.map(
      (application) => new Application(application),
    )

    return this.completeLoad(applications.length === 0 ? 'empty' : 'loaded', applications)
  }

  saveAll(applications) {
    if (this.isPersistenceBlocked) {
      return { ok: false, status: 'blocked' }
    }

    if (!this.storage) {
      return { ok: false, status: 'unavailable' }
    }

    if (!Array.isArray(applications)) {
      return { ok: false, status: 'invalid_data' }
    }

    let serializedApplications

    try {
      serializedApplications = applications.map(serializeApplication)
    } catch {
      return { ok: false, status: 'invalid_data' }
    }

    if (
      !serializedApplications.every(isValidStoredApplication) ||
      !hasUniqueApplicationIdentities(serializedApplications)
    ) {
      return { ok: false, status: 'invalid_data' }
    }

    const envelope = {
      schemaVersion: SCHEMA_VERSION,
      applications: serializedApplications,
    }

    try {
      this.storage.setItem(APPLICATION_STORAGE_KEY, JSON.stringify(envelope))
      return { ok: true, status: 'saved' }
    } catch {
      return { ok: false, status: 'write_failure' }
    }
  }

  // Returns the stored text exactly as it is, so the user can keep a copy of data that
  // could not be loaded. Never parses, repairs, or deletes it.
  readRawValue() {
    try {
      return this.storage?.getItem(APPLICATION_STORAGE_KEY) ?? null
    } catch {
      return null
    }
  }

  blockPersistence(status) {
    this.isPersistenceBlocked = true
    return { ok: false, status, applications: [] }
  }

  completeLoad(status, applications) {
    this.isPersistenceBlocked = false
    return { ok: true, status, applications }
  }
}

export default LocalStorageApplicationRepository
