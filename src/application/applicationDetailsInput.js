import {
  APPLICATION_NEXT_ACTION_MAX_LENGTH,
  APPLICATION_NOTES_MAX_LENGTH,
} from '../domain/Application.js'
import { canHaveFollowUp } from '../domain/followUpPolicy.js'
import { isValidDateString, toLocalDateString } from '../utils/date.js'

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export function createApplicationDetailsDraft(application) {
  return {
    appliedDate: toLocalDateString(application.appliedAt) ?? '',
    followUpDate: application.followUpAt ?? '',
    nextAction: application.nextAction ?? '',
    notes: application.notes ?? '',
  }
}

// `status` decides whether a follow-up may exist; `today` is the local 'YYYY-MM-DD' date.
export function validateApplicationDetailsInput(input = {}, { status, today }) {
  const errors = {}

  if (!normalizeText(input.appliedDate)) {
    errors.appliedDate = 'required'
  } else if (!isValidDateString(input.appliedDate)) {
    errors.appliedDate = 'invalid_date'
  } else if (input.appliedDate > today) {
    errors.appliedDate = 'future_date'
  }

  if (input.followUpDate) {
    if (!canHaveFollowUp(status)) {
      errors.followUpDate = 'not_allowed'
    } else if (!isValidDateString(input.followUpDate)) {
      errors.followUpDate = 'invalid_date'
    } else if (!errors.appliedDate && input.followUpDate < input.appliedDate) {
      errors.followUpDate = 'before_applied_date'
    }
  }

  if (typeof input.nextAction !== 'string') {
    errors.nextAction = 'invalid_text'
  } else if (normalizeText(input.nextAction).length > APPLICATION_NEXT_ACTION_MAX_LENGTH) {
    errors.nextAction = 'too_long'
  }

  if (typeof input.notes !== 'string') {
    errors.notes = 'invalid_text'
  } else if (normalizeText(input.notes).length > APPLICATION_NOTES_MAX_LENGTH) {
    errors.notes = 'too_long'
  }

  return errors
}

export function normalizeApplicationDetailsInput(input) {
  return {
    appliedDate: input.appliedDate,
    followUpDate: input.followUpDate || null,
    nextAction: normalizeText(input.nextAction),
    notes: normalizeText(input.notes),
  }
}
