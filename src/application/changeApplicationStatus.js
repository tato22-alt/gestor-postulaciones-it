import Application from '../domain/Application.js'
import { canTransitionApplicationStatus } from '../domain/applicationStatusPolicy.js'
import createNextUpdatedAt from './createNextUpdatedAt.js'

export default function changeApplicationStatus(
  applications,
  { id, nextStatus, expectedUpdatedAt, now = new Date() } = {},
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

  if (!canTransitionApplicationStatus(currentApplication.status, nextStatus)) {
    return { ok: false, status: 'invalid_transition' }
  }

  const updatedAt = createNextUpdatedAt(currentApplication.updatedAt, now)

  if (updatedAt === null) {
    return { ok: false, status: 'invalid_timestamp' }
  }

  const updatedApplication = new Application({
    ...currentApplication,
    status: nextStatus,
    updatedAt,
  })
  const nextApplications = [...applications]

  nextApplications[applicationIndex] = updatedApplication

  return {
    ok: true,
    status: 'updated',
    application: updatedApplication,
    applications: nextApplications,
  }
}
