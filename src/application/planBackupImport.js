import Application from '../domain/Application.js'
import CompanySource from '../domain/CompanySource.js'
import JobOpportunity from '../domain/JobOpportunity.js'
import createNextUpdatedAt from './createNextUpdatedAt.js'

// Plans a non-destructive import: records from the backup are only ever added. Existing
// records are never replaced or removed, and every skipped record is counted with a reason.
export default function planBackupImport({
  currentOpportunities,
  currentApplications,
  backupOpportunities,
  backupApplications,
  currentSources = [],
  backupSources = [],
  currentProfile = null,
  backupProfile = null,
  deletions = [],
  now = new Date(),
}) {
  const deletedAtByKey = new Map(
    deletions.map((record) => [`${record.collection}:${record.id}`, record.deletedAt]),
  )

  // A record that was deleted before is imported as edited now, so the synchronized
  // deletion does not remove it again.
  const reviveIfDeleted = (collection, EntityClass, record) => {
    const deletedAt = deletedAtByKey.get(`${collection}:${record.id}`)

    if (deletedAt === undefined) return record

    const latest = deletedAt > record.updatedAt ? deletedAt : record.updatedAt
    const updatedAt = createNextUpdatedAt(latest, now) ?? record.updatedAt

    return new EntityClass({ ...record, updatedAt })
  }

  const sourceIds = new Set(currentSources.map((source) => source.id))
  const sourcesToAdd = backupSources
    .filter((source) => !sourceIds.has(source.id))
    .map((source) => reviveIfDeleted('sources', CompanySource, source))

  for (const source of sourcesToAdd) {
    sourceIds.add(source.id)
  }

  let opportunitiesWithoutSource = 0

  const opportunityIds = new Set(currentOpportunities.map((opportunity) => opportunity.id))
  const opportunitiesToAdd = []
  let existingOpportunities = 0

  for (const opportunity of backupOpportunities) {
    if (opportunityIds.has(opportunity.id)) {
      existingOpportunities += 1
    } else {
      opportunityIds.add(opportunity.id)

      // A reference to a source that is neither stored nor in the backup is dropped, so
      // the opportunity is kept without pointing to a source that does not exist.
      if (opportunity.sourceId !== null && !sourceIds.has(opportunity.sourceId)) {
        opportunitiesWithoutSource += 1
        opportunitiesToAdd.push(
          reviveIfDeleted('opportunities', JobOpportunity, new JobOpportunity({ ...opportunity, sourceId: null })),
        )
      } else {
        opportunitiesToAdd.push(reviveIfDeleted('opportunities', JobOpportunity, opportunity))
      }
    }
  }

  const applicationIds = new Set(currentApplications.map((application) => application.id))
  const appliedOpportunityIds = new Set(
    currentApplications.map((application) => application.opportunityId),
  )
  const applicationsToAdd = []
  const skippedApplications = { existing: 0, withoutOpportunity: 0, alreadyApplied: 0 }

  for (const application of backupApplications) {
    if (applicationIds.has(application.id)) {
      skippedApplications.existing += 1
    } else if (!opportunityIds.has(application.opportunityId)) {
      skippedApplications.withoutOpportunity += 1
    } else if (appliedOpportunityIds.has(application.opportunityId)) {
      skippedApplications.alreadyApplied += 1
    } else {
      applicationIds.add(application.id)
      appliedOpportunityIds.add(application.opportunityId)
      applicationsToAdd.push(reviveIfDeleted('applications', Application, application))
    }
  }

  // Like every other record, an existing profile is never replaced: the backup profile is
  // only added when this browser has none.
  const profileToAdd = currentProfile === null ? backupProfile : null

  return {
    profileToAdd,
    sourcesToAdd,
    opportunitiesToAdd,
    applicationsToAdd,
    skipped: {
      existingProfile: currentProfile !== null && backupProfile !== null,
      existingSources: backupSources.length - sourcesToAdd.length,
      existingOpportunities,
      opportunitiesWithoutSource,
      existingApplications: skippedApplications.existing,
      applicationsWithoutOpportunity: skippedApplications.withoutOpportunity,
      applicationsAlreadyApplied: skippedApplications.alreadyApplied,
    },
    nextOpportunities: [...currentOpportunities, ...opportunitiesToAdd],
    nextApplications: [...currentApplications, ...applicationsToAdd],
    nextSources: [...currentSources, ...sourcesToAdd],
    nextProfile: profileToAdd ?? currentProfile,
    hasChanges:
      profileToAdd !== null ||
      sourcesToAdd.length > 0 || opportunitiesToAdd.length > 0 || applicationsToAdd.length > 0,
  }
}
