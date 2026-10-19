import Application from '../domain/Application.js'
import JobOpportunity, {
  OPPORTUNITY_COMPANY_MAX_LENGTH,
  OPPORTUNITY_DESCRIPTION_MAX_LENGTH,
  OPPORTUNITY_TITLE_MAX_LENGTH,
} from '../domain/JobOpportunity.js'
import {
  hasUniqueApplicationIdentities,
  isValidStoredApplication,
  serializeApplication,
} from './LocalStorageApplicationRepository.js'
import { isValidStoredOpportunity, serializeOpportunity } from './LocalStorageOpportunityRepository.js'
import { hasExactFields, isPlainObject, isValidTimestamp } from './storageValidation.js'

export const BACKUP_FORMAT = 'it-job-search-assistant.backup'
export const BACKUP_SCHEMA_VERSION = 1
export const BACKUP_MAX_BYTES = 5 * 1024 * 1024

const BACKUP_FIELDS = ['format', 'schemaVersion', 'exportedAt', 'opportunities', 'applications']
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

export function createBackupText({ opportunities, applications, now = new Date() }) {
  const backup = {
    format: BACKUP_FORMAT,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date(now).toISOString(),
    opportunities: opportunities.map(serializeOpportunity),
    applications: applications.map(serializeApplication),
  }

  return JSON.stringify(backup, null, 2)
}

// Imported text must respect the same limits as typed text. Browser storage does not
// enforce them, so data saved before the limits existed can still be loaded.
function isWithinOpportunityLimits(record) {
  return (
    record.company.length <= OPPORTUNITY_COMPANY_MAX_LENGTH &&
    record.title.length <= OPPORTUNITY_TITLE_MAX_LENGTH &&
    record.description.length <= OPPORTUNITY_DESCRIPTION_MAX_LENGTH
  )
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

  if (backup.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    return { ok: false, status: 'unsupported_version' }
  }

  if (
    !hasExactFields(backup, BACKUP_FIELDS) ||
    !isValidTimestamp(backup.exportedAt) ||
    !Array.isArray(backup.opportunities) ||
    !Array.isArray(backup.applications) ||
    !backup.opportunities.every(isValidStoredOpportunity) ||
    !backup.opportunities.every(isWithinOpportunityLimits) ||
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
  }
}
