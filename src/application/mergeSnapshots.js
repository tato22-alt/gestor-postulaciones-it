import Application from '../domain/Application.js'
import CompanySource from '../domain/CompanySource.js'
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

// Keeps local order and appends records that only exist remotely. When both sides have
// the same record, the most recent edit wins; on a tie the local copy is kept.
function mergeRecords(localRecords, remoteRecords) {
  const merged = new Map(localRecords.map((record) => [record.id, record]))

  for (const remote of remoteRecords) {
    const local = merged.get(remote.id)

    if (!local || remote.updatedAt > local.updatedAt) {
      merged.set(remote.id, remote)
    }
  }

  return [...merged.values()]
}

function toComparable(snapshot) {
  return JSON.stringify({
    opportunities: snapshot.opportunities,
    applications: snapshot.applications,
    sources: snapshot.sources,
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
 * - an opportunity that points to a deleted source keeps its data without that source.
 */
export default function mergeSnapshots(local, remote) {
  const deletions = mergeDeletions(local.deletions, remote.deletions)
  const result = {}

  for (const [collection, EntityClass] of Object.entries(COLLECTIONS)) {
    result[collection] = mergeRecords(local[collection], remote[collection]).filter((record) => {
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

    const [keep, drop] =
      application.updatedAt > current.updatedAt ? [application, current] : [current, application]

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

  const sourceIds = new Set(result.sources.map((source) => source.id))
  result.opportunities = result.opportunities.map((opportunity) =>
    opportunity.sourceId !== null && !sourceIds.has(opportunity.sourceId)
      ? new JobOpportunity({ ...opportunity, sourceId: null })
      : opportunity,
  )

  result.deletions = [...deletions.values()]

  const merged = toComparable(result)

  return {
    ...result,
    changedLocal: merged !== toComparable(local),
    changedRemote: merged !== toComparable(remote),
    duplicateApplicationsResolved,
  }
}
