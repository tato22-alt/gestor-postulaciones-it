import { EMPLOYMENT_TYPES, MODALITIES } from '../constants/domainOptions.js'
import {
  OPPORTUNITY_COMPANY_MAX_LENGTH,
  OPPORTUNITY_DESCRIPTION_MAX_LENGTH,
  OPPORTUNITY_TITLE_MAX_LENGTH,
} from '../domain/JobOpportunity.js'
import { isValidDateString } from '../utils/date.js'
import { isValidHttpUrl, normalizeHttpUrl } from '../utils/url.js'

const VALID_MODALITIES = new Set(
  Object.values(MODALITIES).map((modality) => modality.value),
)

const VALID_EMPLOYMENT_TYPES = new Set(
  Object.values(EMPLOYMENT_TYPES).map((employmentType) => employmentType.value),
)

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function isValidPublishedDate(value) {
  if (value === '' || value === null || value === undefined) {
    return true
  }

  return isValidDateString(value)
}

export function createOpportunityDraft(opportunity = {}) {
  return {
    company: typeof opportunity.company === 'string' ? opportunity.company : '',
    title: typeof opportunity.title === 'string' ? opportunity.title : '',
    url: typeof opportunity.url === 'string' ? opportunity.url : '',
    location: typeof opportunity.location === 'string' ? opportunity.location : '',
    modality: opportunity.modality ?? '',
    employmentType: opportunity.employmentType ?? '',
    publishedAt: opportunity.publishedAt ?? '',
    description:
      typeof opportunity.description === 'string' ? opportunity.description : '',
    status: typeof opportunity.status === 'string' ? opportunity.status : '',
  }
}

export function validateOpportunityInput(input = {}) {
  const errors = {}

  if (!normalizeText(input.company)) {
    errors.company = 'required'
  } else if (normalizeText(input.company).length > OPPORTUNITY_COMPANY_MAX_LENGTH) {
    errors.company = 'too_long'
  }

  if (!normalizeText(input.title)) {
    errors.title = 'required'
  } else if (normalizeText(input.title).length > OPPORTUNITY_TITLE_MAX_LENGTH) {
    errors.title = 'too_long'
  }

  if (!normalizeText(input.url)) {
    errors.url = 'required'
  } else if (!isValidHttpUrl(input.url)) {
    errors.url = 'invalid_url'
  }

  if (typeof input.location !== 'string') {
    errors.location = 'invalid_text'
  }

  if (
    input.modality !== '' &&
    input.modality !== null &&
    !VALID_MODALITIES.has(input.modality)
  ) {
    errors.modality = 'invalid_option'
  }

  if (
    input.employmentType !== '' &&
    input.employmentType !== null &&
    !VALID_EMPLOYMENT_TYPES.has(input.employmentType)
  ) {
    errors.employmentType = 'invalid_option'
  }

  if (!isValidPublishedDate(input.publishedAt)) {
    errors.publishedAt = 'invalid_date'
  }

  if (typeof input.description !== 'string') {
    errors.description = 'invalid_text'
  } else if (normalizeText(input.description).length > OPPORTUNITY_DESCRIPTION_MAX_LENGTH) {
    errors.description = 'too_long'
  }

  return errors
}

export function normalizeOpportunityInput(input) {
  const normalizedUrl = normalizeText(input.url)

  return {
    company: normalizeText(input.company),
    title: normalizeText(input.title),
    url: isValidHttpUrl(normalizedUrl)
      ? normalizeHttpUrl(normalizedUrl)
      : normalizedUrl,
    location: normalizeText(input.location),
    modality: input.modality || null,
    employmentType: input.employmentType || null,
    publishedAt: input.publishedAt || null,
    description: normalizeText(input.description),
    ...(input.status ? { status: input.status } : {}),
  }
}
