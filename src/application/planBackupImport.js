import JobOpportunity from '../domain/JobOpportunity.js'

// Plans a non-destructive import: records from the backup are only ever added. Existing
// records are never replaced or removed, and every skipped record is counted with a reason.
export default function planBackupImport({
  currentOpportunities,
  currentApplications,
  backupOpportunities,
  backupApplications,
  currentSources = [],
  backupSources = [],
}) {
  const sourceIds = new Set(currentSources.map((source) => source.id))
  const sourcesToAdd = backupSources.filter((source) => !sourceIds.has(source.id))

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
        opportunitiesToAdd.push(new JobOpportunity({ ...opportunity, sourceId: null }))
      } else {
        opportunitiesToAdd.push(opportunity)
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
      applicationsToAdd.push(application)
    }
  }

  return {
    sourcesToAdd,
    opportunitiesToAdd,
    applicationsToAdd,
    skipped: {
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
    hasChanges:
      sourcesToAdd.length > 0 || opportunitiesToAdd.length > 0 || applicationsToAdd.length > 0,
  }
}
