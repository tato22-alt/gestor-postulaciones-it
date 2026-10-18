import JobOpportunity from '../src/domain/JobOpportunity.js'

export const BASE_TIMESTAMP = '2026-01-05T10:00:00.000Z'

export function createOpportunity(overrides = {}) {
  return new JobOpportunity({
    id: 'opportunity-1',
    company: 'Acme',
    title: 'Desarrollador trainee',
    url: 'https://example.com/jobs/1',
    detectedAt: BASE_TIMESTAMP,
    ...overrides,
  })
}

export function createValidInput(overrides = {}) {
  return {
    company: 'Acme',
    title: 'Desarrollador trainee',
    url: 'https://example.com/jobs/1',
    location: '',
    modality: '',
    employmentType: '',
    publishedAt: '',
    description: '',
    ...overrides,
  }
}

export class MemoryStorage {
  constructor(initialEntries = {}) {
    this.entries = new Map(Object.entries(initialEntries))
  }

  getItem(key) {
    return this.entries.has(key) ? this.entries.get(key) : null
  }

  setItem(key, value) {
    this.entries.set(key, String(value))
  }
}
