import { SOURCE_STATUSES } from '../constants/domainOptions.js'
import CompanySource from '../domain/CompanySource.js'
import createNextUpdatedAt from './createNextUpdatedAt.js'
import { normalizeSourceInput, validateSourceInput } from './sourceInput.js'

// A source the user adds by hand is approved by that same action: nothing is discovered
// or monitored automatically, so the user is always the one who decides.
export function createSource(sources, { changes, now = new Date() } = {}) {
  if (!Array.isArray(sources)) {
    return { ok: false, status: 'invalid_collection' }
  }

  const errors = validateSourceInput(changes)

  if (Object.keys(errors).length > 0) {
    return { ok: false, status: 'invalid_input', errors }
  }

  const timestamp = new Date(now).toISOString()
  const source = new CompanySource({
    ...normalizeSourceInput(changes),
    status: SOURCE_STATUSES.APPROVED.value,
    discoveredAt: timestamp,
    approvedAt: timestamp,
  })

  return { ok: true, status: 'created', source, sources: [...sources, source] }
}

export function updateSource(sources, { id, expectedUpdatedAt, changes, now = new Date() } = {}) {
  if (!Array.isArray(sources)) {
    return { ok: false, status: 'invalid_collection' }
  }

  const index = sources.findIndex((source) => source?.id === id)

  if (index === -1) {
    return { ok: false, status: 'not_found' }
  }

  const current = sources[index]

  if (current.updatedAt !== expectedUpdatedAt) {
    return { ok: false, status: 'conflict' }
  }

  const errors = validateSourceInput(changes)

  if (Object.keys(errors).length > 0) {
    return { ok: false, status: 'invalid_input', errors }
  }

  const updatedAt = createNextUpdatedAt(current.updatedAt, now)

  if (updatedAt === null) {
    return { ok: false, status: 'invalid_timestamp' }
  }

  const source = new CompanySource({ ...current, ...normalizeSourceInput(changes), updatedAt })
  const nextSources = [...sources]

  nextSources[index] = source

  return { ok: true, status: 'updated', source, sources: nextSources }
}

// A source referenced by opportunities cannot be deleted, so no opportunity is left
// pointing to a source that no longer exists.
export function deleteSource(sources, opportunities, { id, expectedUpdatedAt } = {}) {
  if (!Array.isArray(sources) || !Array.isArray(opportunities)) {
    return { ok: false, status: 'invalid_collection' }
  }

  const source = sources.find((current) => current?.id === id)

  if (!source) {
    return { ok: false, status: 'not_found' }
  }

  if (source.updatedAt !== expectedUpdatedAt) {
    return { ok: false, status: 'conflict' }
  }

  if (opportunities.some((opportunity) => opportunity.sourceId === id)) {
    return { ok: false, status: 'has_opportunities' }
  }

  return { ok: true, status: 'deleted', sources: sources.filter((current) => current.id !== id) }
}
