import JobSearchPreferences from '../domain/JobSearchPreferences.js'
import { isValidPreferenceOptions, isValidTargetRoleList } from '../domain/jobSearchPreferencesPolicy.js'
import {
  hasExactFields,
  isNonEmptyString,
  isPlainObject,
  isValidTimestamp,
} from './storageValidation.js'

export const PREFERENCES_STORAGE_KEY = 'it-job-search-assistant.preferences'

const SCHEMA_VERSION = 1

// Only the approved preferences are persisted. Other JobSearchPreferences fields are not
// editable yet, so they are never stored.
const PREFERENCES_FIELDS = [
  'id',
  'targetRoles',
  'preferredModalities',
  'acceptedEmploymentTypes',
  'createdAt',
  'updatedAt',
]

export function isValidStoredPreferences(value) {
  return (
    isPlainObject(value) &&
    hasExactFields(value, PREFERENCES_FIELDS) &&
    isNonEmptyString(value.id) &&
    isValidTargetRoleList(value.targetRoles) &&
    isValidPreferenceOptions('preferredModalities', value.preferredModalities) &&
    isValidPreferenceOptions('acceptedEmploymentTypes', value.acceptedEmploymentTypes) &&
    isValidTimestamp(value.createdAt) &&
    isValidTimestamp(value.updatedAt)
  )
}

export function serializePreferences(preferences) {
  return {
    id: preferences.id,
    targetRoles: [...preferences.targetRoles],
    preferredModalities: [...preferences.preferredModalities],
    acceptedEmploymentTypes: [...preferences.acceptedEmploymentTypes],
    createdAt: preferences.createdAt,
    updatedAt: preferences.updatedAt,
  }
}

export function rehydratePreferences(record) {
  return new JobSearchPreferences({
    id: record.id,
    targetRoles: record.targetRoles,
    preferredModalities: record.preferredModalities,
    acceptedEmploymentTypes: record.acceptedEmploymentTypes,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  })
}

// Stores at most one set of preferences: the person using this browser. `null` means none yet.
class LocalStoragePreferencesRepository {
  constructor(storage) {
    this.storage = storage
    this.isPersistenceBlocked = false
  }

  load() {
    if (!this.storage) {
      return this.blockPersistence('unavailable')
    }

    let rawValue

    try {
      rawValue = this.storage.getItem(PREFERENCES_STORAGE_KEY)
    } catch {
      return this.blockPersistence('read_failure')
    }

    if (rawValue === null || rawValue === undefined) {
      return this.completeLoad('empty', null)
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
      !hasExactFields(envelope, ['schemaVersion', 'preferences']) ||
      (envelope.preferences !== null && !isValidStoredPreferences(envelope.preferences))
    ) {
      return this.blockPersistence('corrupted')
    }

    if (envelope.preferences === null) {
      return this.completeLoad('empty', null)
    }

    return this.completeLoad('loaded', rehydratePreferences(envelope.preferences))
  }

  save(preferences) {
    if (this.isPersistenceBlocked) {
      return { ok: false, status: 'blocked' }
    }

    if (!this.storage) {
      return { ok: false, status: 'unavailable' }
    }

    let serializedPreferences

    try {
      serializedPreferences = preferences === null ? null : serializePreferences(preferences)
    } catch {
      return { ok: false, status: 'invalid_data' }
    }

    if (serializedPreferences !== null && !isValidStoredPreferences(serializedPreferences)) {
      return { ok: false, status: 'invalid_data' }
    }

    try {
      this.storage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify({ schemaVersion: SCHEMA_VERSION, preferences: serializedPreferences }),
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
      return this.storage?.getItem(PREFERENCES_STORAGE_KEY) ?? null
    } catch {
      return null
    }
  }

  blockPersistence(status) {
    this.isPersistenceBlocked = true
    return { ok: false, status, preferences: null }
  }

  completeLoad(status, preferences) {
    this.isPersistenceBlocked = false
    return { ok: true, status, preferences }
  }
}

export default LocalStoragePreferencesRepository
