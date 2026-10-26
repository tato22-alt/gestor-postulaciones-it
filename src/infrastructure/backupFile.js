import Application from '../domain/Application.js'
import JobOpportunity from '../domain/JobOpportunity.js'
import {
  hasUniqueApplicationIdentities,
  isValidStoredApplication,
  serializeApplication,
} from './LocalStorageApplicationRepository.js'
import { isValidStoredOpportunity, serializeOpportunity } from './LocalStorageOpportunityRepository.js'
import {
  hasUniqueSourceIds,
  isValidStoredSource,
  serializeSource,
} from './LocalStorageSourceRepository.js'
import CompanySource from '../domain/CompanySource.js'
import { hasUniqueDeletionKeys, isValidDeletionRecord, serializeDeletion } from './deletionRecords.js'
import {
  isValidStoredPreferences,
  rehydratePreferences,
  serializePreferences,
} from './LocalStoragePreferencesRepository.js'
import { isValidStoredProfile, rehydrateProfile, serializeProfile } from './LocalStorageProfileRepository.js'
import { hasExactFields, isPlainObject, isValidTimestamp } from './storageValidation.js'

export const BACKUP_FORMAT = 'it-job-search-assistant.backup'
// Version 2 adds job sources, version 3 adds deletion records, which synchronization
// needs, version 4 adds the candidate profile (or null), and version 5 adds the job search
// preferences (or null). Older versions are still accepted.
export const BACKUP_SCHEMA_VERSION = 5
export const BACKUP_MAX_BYTES = 5 * 1024 * 1024

const BACKUP_FIELDS_BY_VERSION = {
  1: ['format', 'schemaVersion', 'exportedAt', 'opportunities', 'applications'],
  2: ['format', 'schemaVersion', 'exportedAt', 'opportunities', 'applications', 'sources'],
  3: ['format', 'schemaVersion', 'exportedAt', 'opportunities', 'applications', 'sources', 'deletions'],
  4: ['format', 'schemaVersion', 'exportedAt', 'opportunities', 'applications', 'sources', 'deletions', 'profile'],
  5: [
    'format',
    'schemaVersion',
    'exportedAt',
    'opportunities',
    'applications',
    'sources',
    'deletions',
    'profile',
    'preferences',
  ],
}
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

export function createBackupText({
  opportunities,
  applications,
  sources,
  deletions = [],
  profile = null,
  preferences = null,
  now = new Date(),
}) {
  const backup = {
    format: BACKUP_FORMAT,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date(now).toISOString(),
    opportunities: opportunities.map(serializeOpportunity),
    applications: applications.map(serializeApplication),
    sources: sources.map(serializeSource),
    deletions: deletions.map(serializeDeletion),
    profile: profile === null ? null : serializeProfile(profile),
    preferences: preferences === null ? null : serializePreferences(preferences),
  }

  return JSON.stringify(backup, null, 2)
}

function hasUniqueIds(records) {
  return new Set(records.map((record) => record.id)).size === records.length
}

// A backup file is untrusted input: it is parsed and validated with the same strict rules
// as browser storage, and only then rehydrated into domain instances.
export function parseBackupText(text) {
  if (typeof text !== 'string') {
    return { ok: false, status: 'invalid_json' }
  }

  if (text.length > BACKUP_MAX_BYTES) {
    return { ok: false, status: 'too_large' }
  }

  let hasForbiddenKey = false
  let backup

  try {
    backup = JSON.parse(text, (key, value) => {
      if (FORBIDDEN_KEYS.has(key)) {
        hasForbiddenKey = true
      }

      return value
    })
  } catch {
    return { ok: false, status: 'invalid_json' }
  }

  if (hasForbiddenKey) {
    return { ok: false, status: 'invalid_records' }
  }

  if (!isPlainObject(backup) || backup.format !== BACKUP_FORMAT) {
    return { ok: false, status: 'unknown_format' }
  }

  const version = backup.schemaVersion
  const fields =
    Number.isInteger(version) && Object.hasOwn(BACKUP_FIELDS_BY_VERSION, version)
      ? BACKUP_FIELDS_BY_VERSION[version]
      : null

  if (!fields) {
    return { ok: false, status: 'unsupported_version' }
  }

  const sources = backup.schemaVersion >= 2 ? backup.sources : []
  const deletions = backup.schemaVersion >= 3 ? backup.deletions : []
  const profile = backup.schemaVersion >= 4 ? backup.profile : null
  const preferences = backup.schemaVersion >= 5 ? backup.preferences : null

  if (
    !hasExactFields(backup, fields) ||
    !Array.isArray(sources) ||
    !sources.every(isValidStoredSource) ||
    !hasUniqueSourceIds(sources) ||
    !Array.isArray(deletions) ||
    !deletions.every(isValidDeletionRecord) ||
    !hasUniqueDeletionKeys(deletions) ||
    (profile !== null && !isValidStoredProfile(profile)) ||
    (preferences !== null && !isValidStoredPreferences(preferences)) ||
    !isValidTimestamp(backup.exportedAt) ||
    !Array.isArray(backup.opportunities) ||
    !Array.isArray(backup.applications) ||
    !backup.opportunities.every(isValidStoredOpportunity) ||
    !hasUniqueIds(backup.opportunities) ||
    !backup.applications.every(isValidStoredApplication) ||
    !hasUniqueApplicationIdentities(backup.applications)
  ) {
    return { ok: false, status: 'invalid_records' }
  }

  return {
    ok: true,
    status: 'parsed',
    opportunities: backup.opportunities.map((record) => new JobOpportunity(record)),
    applications: backup.applications.map((record) => new Application(record)),
    sources: sources.map((record) => new CompanySource(record)),
    deletions: deletions.map(serializeDeletion),
    profile: profile === null ? null : rehydrateProfile(profile),
    preferences: preferences === null ? null : rehydratePreferences(preferences),
  }
}
