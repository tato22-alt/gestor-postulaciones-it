import Application from '../domain/Application.js'
import { localDateStringToTimestamp, toLocalDateString } from '../utils/date.js'
import {
  normalizeApplicationDetailsInput,
  validateApplicationDetailsInput,
} from './applicationDetailsInput.js'
import createNextUpdatedAt from './createNextUpdatedAt.js'

export default function updateApplicationDetails(
  applications,
  { id, expectedUpdatedAt, changes, now = new Date() } = {},
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

  const today = toLocalDateString(now)

  if (today === null) {
    return { ok: false, status: 'invalid_timestamp' }
  }

  const errors = validateApplicationDetailsInput(changes, {
    status: currentApplication.status,
    today,
  })

  if (Object.keys(errors).length > 0) {
    return { ok: false, status: 'invalid_input', errors }
  }

  const normalizedChanges = normalizeApplicationDetailsInput(changes, {
    status: currentApplication.status,
  })
  const updatedAt = createNextUpdatedAt(currentApplication.updatedAt, now)

  if (updatedAt === null) {
    return { ok: false, status: 'invalid_timestamp' }
  }

  // Keep the original timestamp when the calendar day did not change, so editing other
  // fields never loses the exact moment the application was registered.
  const appliedAt =
    toLocalDateString(currentApplication.appliedAt) === normalizedChanges.appliedDate
      ? currentApplication.appliedAt
      : localDateStringToTimestamp(normalizedChanges.appliedDate)

  const updatedApplication = new Application({
    ...currentApplication,
    appliedAt,
    followUpAt: normalizedChanges.followUpDate,
    nextAction: normalizedChanges.nextAction,
    notes: normalizedChanges.notes,
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
