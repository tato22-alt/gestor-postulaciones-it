import { isPlainObject } from './storageValidation.js'
import { hasUniqueDeletionKeys, isValidDeletionRecord, serializeDeletion } from './deletionRecords.js'

export const DELETION_STORAGE_KEY = 'it-job-search-assistant.deletions'

const SCHEMA_VERSION = 1

class LocalStorageDeletionRepository {
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
      rawValue = this.storage.getItem(DELETION_STORAGE_KEY)
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

    if (!isPlainObject(envelope) || envelope.schemaVersion !== SCHEMA_VERSION) {
      return this.blockPersistence('corrupted')
    }

    if (
      !Array.isArray(envelope.deletions) ||
      !envelope.deletions.every(isValidDeletionRecord) ||
      !hasUniqueDeletionKeys(envelope.deletions)
    ) {
      return this.blockPersistence('corrupted')
    }

    return this.completeLoad('loaded', envelope.deletions.map(serializeDeletion))
  }

  saveAll(deletions) {
    if (this.isPersistenceBlocked) {
      return { ok: false, status: 'blocked' }
    }

    if (!this.storage) {
      return { ok: false, status: 'unavailable' }
    }

    if (
      !Array.isArray(deletions) ||
      !deletions.every(isValidDeletionRecord) ||
      !hasUniqueDeletionKeys(deletions)
    ) {
      return { ok: false, status: 'invalid_data' }
    }

    try {
      this.storage.setItem(
        DELETION_STORAGE_KEY,
        JSON.stringify({ schemaVersion: SCHEMA_VERSION, deletions: deletions.map(serializeDeletion) }),
      )
      return { ok: true, status: 'saved' }
    } catch {
      return { ok: false, status: 'write_failure' }
    }
  }

  blockPersistence(status) {
    this.isPersistenceBlocked = true
    return { ok: false, status, deletions: [] }
  }

  completeLoad(status, deletions) {
    this.isPersistenceBlocked = false
    return { ok: true, status, deletions }
  }
}

export default LocalStorageDeletionRepository
