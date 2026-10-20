import { hasExactFields, isNonEmptyString, isPlainObject, isValidTimestamp } from './storageValidation.js'

// A deletion record ("tombstone") remembers that a record was deleted, so a device that
// still has it cannot bring it back when the data is synchronized.
export const DELETION_COLLECTIONS = Object.freeze(['opportunities', 'applications', 'sources'])

const DELETION_FIELDS = ['collection', 'id', 'deletedAt']

export function isValidDeletionRecord(value) {
  return (
    isPlainObject(value) &&
    hasExactFields(value, DELETION_FIELDS) &&
    DELETION_COLLECTIONS.includes(value.collection) &&
    isNonEmptyString(value.id) &&
    isValidTimestamp(value.deletedAt)
  )
}

export function hasUniqueDeletionKeys(records) {
  return new Set(records.map((record) => `${record.collection}:${record.id}`)).size === records.length
}

export function serializeDeletion(record) {
  return { collection: record.collection, id: record.id, deletedAt: record.deletedAt }
}
