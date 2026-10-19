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
import {
  hasUniqueSourceIds,
  isValidStoredSource,
  serializeSource,
} from './LocalStorageSourceRepository.js'
import CompanySource from '../domain/CompanySource.js'
import { hasExactFields, isPlainObject, isValidTimestamp } from './storageValidation.js'

export const BACKUP_FORMAT = 'it-job-search-assistant.backup'
// Version 2 adds job sources. Version 1 backups (without sources) are still accepted.
export const BACKUP_SCHEMA_VERSION = 2
export const BACKUP_MAX_BYTES = 5 * 1024 * 1024

const BACKUP_FIELDS_BY_VERSION = {
  1: ['format', 'schemaVersion', 'exportedAt', 'opportunities', 'applications'],
  2: ['format', 'schemaVersion', 'exportedAt', 'opportunities', 'applications', 'sources'],
}
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

export function createBackupText({ opportunities, applications, sources, now = new Date() }) {
  const backup = {
    format: BACKUP_FORMAT,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date(now).toISOString(),
    opportunities: opportunities.map(serializeOpportunity),
    applications: applications.map(serializeApplication),
    sources: sources.map(serializeSource),
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

  const fields = BACKUP_FIELDS_BY_VERSION[backup.schemaVersion]

  if (!fields) {
    return { ok: false, status: 'unsupported_version' }
  }

  const sources = backup.schemaVersion >= 2 ? backup.sources : []

  if (
    !hasExactFields(backup, fields) ||
    !Array.isArray(sources) ||
    !sources.every(isValidStoredSource) ||
    !hasUniqueSourceIds(sources) ||
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
    sources: sources.map((record) => new CompanySource(record)),
  }
}
