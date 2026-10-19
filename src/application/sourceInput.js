import { SOURCE_COMPANY_NAME_MAX_LENGTH } from '../domain/CompanySource.js'
import { isValidHttpUrl, normalizeHttpUrl } from '../utils/url.js'

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export function createSourceDraft(source = {}) {
  return {
    companyName: typeof source.companyName === 'string' ? source.companyName : '',
    careersUrl: typeof source.careersUrl === 'string' ? source.careersUrl : '',
  }
}

export function validateSourceInput(input = {}) {
  const errors = {}
  const companyName = normalizeText(input.companyName)

  if (!companyName) {
    errors.companyName = 'required'
  } else if (companyName.length > SOURCE_COMPANY_NAME_MAX_LENGTH) {
    errors.companyName = 'too_long'
  }

  if (!normalizeText(input.careersUrl)) {
    errors.careersUrl = 'required'
  } else if (!isValidHttpUrl(input.careersUrl)) {
    errors.careersUrl = 'invalid_url'
  }

  return errors
}

export function normalizeSourceInput(input) {
  return {
    companyName: normalizeText(input.companyName),
    careersUrl: normalizeHttpUrl(normalizeText(input.careersUrl)),
  }
}
