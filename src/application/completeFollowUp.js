import Application from '../domain/Application.js'
import createNextUpdatedAt from './createNextUpdatedAt.js'

// Marks the pending follow-up as done by clearing it. Scheduling another one is a separate,
// explicit edit, so the user decides whether a new follow-up is needed.
export default function completeFollowUp(
  applications,
  { id, expectedUpdatedAt, now = new Date() } = {},
) {
  if (!Array.isArray(applications)) {
    return { ok: false, status: 'invalid_collection' }
  }

  const applicationIndex = applications.findIndex((application) => application?.id === id)

  if (applicationIndex === -1) {
    return { ok: false, status: 'not_found' }
  }

  const currentApplication = applications[applicationIndex]

  if (currentApplication.updatedAt !== expectedUpdatedAt) {
    return { ok: false, status: 'conflict' }
  }

  if (currentApplication.followUpAt === null) {
    return { ok: false, status: 'no_follow_up' }
  }

  const updatedAt = createNextUpdatedAt(currentApplication.updatedAt, now)

  if (updatedAt === null) {
    return { ok: false, status: 'invalid_timestamp' }
  }

  const updatedApplication = new Application({
    ...currentApplication,
    followUpAt: null,
    updatedAt,
  })
  const nextApplications = [...applications]

  nextApplications[applicationIndex] = updatedApplication

  return {
    ok: true,
    status: 'completed',
    application: updatedApplication,
    applications: nextApplications,
  }
}
