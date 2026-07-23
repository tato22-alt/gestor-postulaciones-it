import { EMPLOYMENT_TYPES, MODALITIES } from '../constants/domainOptions.js'
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

  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const parsedDate = new Date(`${value}T00:00:00.000Z`)

  return (
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === value
  )
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
  }
}

export function validateOpportunityInput(input = {}) {
  const errors = {}

  if (!normalizeText(input.company)) {
    errors.company = 'required'
  }

  if (!normalizeText(input.title)) {
    errors.title = 'required'
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
  }
}
