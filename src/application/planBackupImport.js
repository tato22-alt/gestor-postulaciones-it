// Plans a non-destructive import: records from the backup are only ever added. Existing
// records are never replaced or removed, and every skipped record is counted with a reason.
export default function planBackupImport({
  currentOpportunities,
  currentApplications,
  backupOpportunities,
  backupApplications,
}) {
  const opportunityIds = new Set(currentOpportunities.map((opportunity) => opportunity.id))
  const opportunitiesToAdd = []
  let existingOpportunities = 0

  for (const opportunity of backupOpportunities) {
    if (opportunityIds.has(opportunity.id)) {
      existingOpportunities += 1
    } else {
      opportunityIds.add(opportunity.id)
      opportunitiesToAdd.push(opportunity)
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
    opportunitiesToAdd,
    applicationsToAdd,
    skipped: {
      existingOpportunities,
      existingApplications: skippedApplications.existing,
      applicationsWithoutOpportunity: skippedApplications.withoutOpportunity,
      applicationsAlreadyApplied: skippedApplications.alreadyApplied,
    },
    nextOpportunities: [...currentOpportunities, ...opportunitiesToAdd],
    nextApplications: [...currentApplications, ...applicationsToAdd],
    hasChanges: opportunitiesToAdd.length > 0 || applicationsToAdd.length > 0,
  }
}
