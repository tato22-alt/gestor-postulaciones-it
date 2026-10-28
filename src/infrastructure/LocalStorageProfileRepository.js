import CandidateProfile from '../domain/CandidateProfile.js'
import { isValidSkillList } from '../domain/candidateSkillsPolicy.js'
import { isValidCvText } from '../domain/cvPolicy.js'
import {
  hasExactFields,
  isNonEmptyString,
  isPlainObject,
  isValidTimestamp,
} from './storageValidation.js'

export const PROFILE_STORAGE_KEY = 'it-job-search-assistant.profile'

// Version 2 adds the CV text. Version 1 envelopes are still read.
const SCHEMA_VERSION = 2
export const PROFILE_RECORD_VERSION = 2

// Only the approved profile data is persisted: the skills and, from version 2, the CV text.
// Other CandidateProfile fields are not editable yet, so they are never stored.
const PROFILE_FIELDS_BY_VERSION = {
  1: ['id', 'skills', 'createdAt', 'updatedAt'],
  2: ['id', 'skills', 'cvText', 'createdAt', 'updatedAt'],
}

export function isValidStoredProfile(value, recordVersion = PROFILE_RECORD_VERSION) {
  const fields = PROFILE_FIELDS_BY_VERSION[recordVersion]

  return (
    Boolean(fields) &&
    isPlainObject(value) &&
    hasExactFields(value, fields) &&
    isNonEmptyString(value.id) &&
    isValidSkillList(value.skills) &&
    (recordVersion < 2 || isValidCvText(value.cvText)) &&
    isValidTimestamp(value.createdAt) &&
    isValidTimestamp(value.updatedAt)
  )
}

export function serializeProfile(profile) {
  return {
    id: profile.id,
    skills: [...profile.skills],
    cvText: profile.cvText,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  }
}

export function rehydrateProfile(record) {
  return new CandidateProfile({
    id: record.id,
    skills: record.skills,
    cvText: record.cvText ?? '',
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  })
}

// Stores at most one profile: the person using this browser. `null` means no profile yet.
class LocalStorageProfileRepository {
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
      rawValue = this.storage.getItem(PROFILE_STORAGE_KEY)
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

    if (envelope.schemaVersion !== 1 && envelope.schemaVersion !== SCHEMA_VERSION) {
      return this.blockPersistence('unsupported_version')
    }

    if (
      !hasExactFields(envelope, ['schemaVersion', 'profile']) ||
      (envelope.profile !== null && !isValidStoredProfile(envelope.profile, envelope.schemaVersion))
    ) {
      return this.blockPersistence('corrupted')
    }

    if (envelope.profile === null) {
      return this.completeLoad('empty', null)
    }

    return this.completeLoad('loaded', rehydrateProfile(envelope.profile))
  }

  save(profile) {
    if (this.isPersistenceBlocked) {
      return { ok: false, status: 'blocked' }
    }

    if (!this.storage) {
      return { ok: false, status: 'unavailable' }
    }

    let serializedProfile

    try {
      serializedProfile = profile === null ? null : serializeProfile(profile)
    } catch {
      return { ok: false, status: 'invalid_data' }
    }

    if (serializedProfile !== null && !isValidStoredProfile(serializedProfile)) {
      return { ok: false, status: 'invalid_data' }
    }

    try {
      this.storage.setItem(
        PROFILE_STORAGE_KEY,
        JSON.stringify({ schemaVersion: SCHEMA_VERSION, profile: serializedProfile }),
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
      return this.storage?.getItem(PROFILE_STORAGE_KEY) ?? null
    } catch {
      return null
    }
  }

  blockPersistence(status) {
    this.isPersistenceBlocked = true
    return { ok: false, status, profile: null }
  }

  completeLoad(status, profile) {
    this.isPersistenceBlocked = false
    return { ok: true, status, profile }
  }
}

export default LocalStorageProfileRepository
