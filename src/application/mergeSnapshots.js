import Application from '../domain/Application.js'
import CandidateProfile from '../domain/CandidateProfile.js'
import CompanySource from '../domain/CompanySource.js'
import JobSearchPreferences from '../domain/JobSearchPreferences.js'
import JobOpportunity from '../domain/JobOpportunity.js'

const COLLECTIONS = {
  opportunities: JobOpportunity,
  applications: Application,
  sources: CompanySource,
}

const deletionKey = (collection, id) => `${collection}:${id}`

function mergeDeletions(localDeletions, remoteDeletions) {
  const byKey = new Map()

  for (const deletion of [...localDeletions, ...remoteDeletions]) {
    const key = deletionKey(deletion.collection, deletion.id)
    const current = byKey.get(key)

    if (!current || deletion.deletedAt > current.deletedAt) {
      byKey.set(key, deletion)
    }
  }

  return byKey
}

// The most recent edit wins. On an exact tie the content decides, so both devices pick
// the same copy no matter which one is local.
function isPreferred(candidate, current) {
  if (candidate.updatedAt !== current.updatedAt) {
    return candidate.updatedAt > current.updatedAt
  }

  return JSON.stringify(candidate) > JSON.stringify(current)
}

// Keeps local order and appends records that only exist remotely.
function mergeRecords(localRecords, remoteRecords) {
  const merged = new Map(localRecords.map((record) => [record.id, record]))

  for (const remote of remoteRecords) {
    const local = merged.get(remote.id)

    if (!local || isPreferred(remote, local)) {
      merged.set(remote.id, remote)
    }
  }

  return [...merged.values()]
}

// Records that exist once per person: the most recent edit wins, like any other record.
// They are never deleted (clearing their lists is an edit), so they need no deletion record.
const SINGLE_RECORDS = {
  profile: CandidateProfile,
  preferences: JobSearchPreferences,
}

function mergeSingleRecord(localRecord, remoteRecord) {
  if (!localRecord || !remoteRecord) {
    return localRecord ?? remoteRecord ?? null
  }

  return isPreferred(remoteRecord, localRecord) ? remoteRecord : localRecord
}

const byId = (records) => [...records].sort((a, b) => a.id.localeCompare(b.id))

// Order is ignored: two snapshots with the same records in a different order are equal.
function toComparable(snapshot) {
  return JSON.stringify({
    opportunities: byId(snapshot.opportunities),
    applications: byId(snapshot.applications),
    sources: byId(snapshot.sources),
    profile: snapshot.profile ?? null,
    preferences: snapshot.preferences ?? null,
    deletions: [...snapshot.deletions].sort((a, b) =>
      deletionKey(a.collection, a.id).localeCompare(deletionKey(b.collection, b.id)),
    ),
  })
}

/**
 * Merges two snapshots of the same user's data (this device and the synchronized copy).
 *
 * Rules, approved by Luciano:
 * - the most recent edit of a record wins (compared by updatedAt);
 * - a deletion wins over every edit made before it; an edit made after a deletion keeps
 *   the record and discards that deletion;
 * - if two devices registered an application for the same opportunity, the most recently
 *   edited one is kept and the other is recorded as deleted, so every device converges;
 * - an opportunity that still has an application is never removed, because an
 *   opportunity with an application cannot be deleted;
 * - an opportunity that points to a deleted source keeps its data without that source;
 * - the candidate profile and the search preferences follow the most-recent-edit rule as
 *   single records.
 */
export default function mergeSnapshots(local, remote) {
  const deletions = mergeDeletions(local.deletions, remote.deletions)
  const result = {}
  const candidates = {}

  for (const [collection, EntityClass] of Object.entries(COLLECTIONS)) {
    candidates[collection] = mergeRecords(local[collection], remote[collection])
    result[collection] = candidates[collection].filter((record) => {
      const deletion = deletions.get(deletionKey(collection, record.id))

      if (!deletion) return true

      if (record.updatedAt > deletion.deletedAt) {
        deletions.delete(deletionKey(collection, record.id))
        return true
      }

      return false
    })
    result[collection] = result[collection].map((record) =>
      record instanceof EntityClass ? record : new EntityClass(record),
    )
  }

  let duplicateApplicationsResolved = 0
  const applicationByOpportunity = new Map()

  for (const application of result.applications) {
    const current = applicationByOpportunity.get(application.opportunityId)

    if (!current) {
      applicationByOpportunity.set(application.opportunityId, application)
      continue
    }

    const [keep, drop] = isPreferred(application, current)
      ? [application, current]
      : [current, application]

    applicationByOpportunity.set(application.opportunityId, keep)
    deletions.set(deletionKey('applications', drop.id), {
      collection: 'applications',
      id: drop.id,
      deletedAt: drop.updatedAt,
    })
    duplicateApplicationsResolved += 1
  }

  const keptApplicationIds = new Set([...applicationByOpportunity.values()].map((a) => a.id))
  result.applications = result.applications.filter((application) => keptApplicationIds.has(application.id))

  // A deletion on one device cannot remove an opportunity that another device used for an
  // application: the opportunity is restored and that deletion is discarded.
  const opportunityIds = new Set(result.opportunities.map((opportunity) => opportunity.id))
  const opportunityById = new Map(candidates.opportunities.map((record) => [record.id, record]))

  for (const application of result.applications) {
    const opportunity = opportunityById.get(application.opportunityId)

    if (!opportunityIds.has(application.opportunityId) && opportunity) {
      opportunityIds.add(opportunity.id)
      deletions.delete(deletionKey('opportunities', opportunity.id))
      result.opportunities.push(
        opportunity instanceof JobOpportunity ? opportunity : new JobOpportunity(opportunity),
      )
    }
  }

  const sourceIds = new Set(result.sources.map((source) => source.id))
  result.opportunities = result.opportunities.map((opportunity) =>
    opportunity.sourceId !== null && !sourceIds.has(opportunity.sourceId)
      ? new JobOpportunity({ ...opportunity, sourceId: null })
      : opportunity,
  )

  result.deletions = [...deletions.values()]

  for (const [name, EntityClass] of Object.entries(SINGLE_RECORDS)) {
    const record = mergeSingleRecord(local[name] ?? null, remote[name] ?? null)
    result[name] = record === null || record instanceof EntityClass ? record : new EntityClass(record)
  }

  const merged = toComparable(result)

  return {
    ...result,
    changedLocal: merged !== toComparable(local),
    changedRemote: merged !== toComparable(remote),
    duplicateApplicationsResolved,
  }
}
