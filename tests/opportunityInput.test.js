import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  createOpportunityDraft,
  normalizeOpportunityInput,
  validateOpportunityInput,
} from '../src/application/opportunityInput.js'
import { createOpportunity, createValidInput } from './helpers.js'

describe('validateOpportunityInput', () => {
  it('accepts a minimal valid input', () => {
    assert.deepEqual(validateOpportunityInput(createValidInput()), {})
  })

  it('requires company, title, and URL, including whitespace-only values', () => {
    assert.deepEqual(
      validateOpportunityInput(createValidInput({ company: '   ', title: '', url: ' ' })),
      { company: 'required', title: 'required', url: 'required' },
    )
  })

  it('rejects unsafe URL schemes', () => {
    assert.deepEqual(
      validateOpportunityInput(createValidInput({ url: 'javascript:alert(1)' })),
      { url: 'invalid_url' },
    )
  })

  it('rejects values outside the controlled options', () => {
    assert.deepEqual(
      validateOpportunityInput(
        createValidInput({ modality: 'Remota', employmentType: 'full time' }),
      ),
      { modality: 'invalid_option', employmentType: 'invalid_option' },
    )
  })

  it('accepts every controlled option', () => {
    for (const modality of ['on_site', 'hybrid', 'remote']) {
      assert.deepEqual(validateOpportunityInput(createValidInput({ modality })), {})
    }
    for (const employmentType of ['full_time', 'part_time', 'internship']) {
      assert.deepEqual(validateOpportunityInput(createValidInput({ employmentType })), {})
    }
  })

  it('validates real calendar dates in YYYY-MM-DD format', () => {
    assert.deepEqual(validateOpportunityInput(createValidInput({ publishedAt: '2026-02-28' })), {})
    for (const publishedAt of ['2026-02-30', '2026-13-01', '28/02/2026', '2026-2-1']) {
      assert.deepEqual(
        validateOpportunityInput(createValidInput({ publishedAt })),
        { publishedAt: 'invalid_date' },
        publishedAt,
      )
    }
  })

  it('rejects non-string optional text fields', () => {
    assert.deepEqual(
      validateOpportunityInput(createValidInput({ location: 5, description: null })),
      { location: 'invalid_text', description: 'invalid_text' },
    )
  })
})

describe('normalizeOpportunityInput', () => {
  it('trims text, canonicalizes the URL, and converts empty options to null', () => {
    assert.deepEqual(
      normalizeOpportunityInput(
        createValidInput({
          company: '  Acme  ',
          title: ' Trainee ',
          url: ' https://Example.com/jobs ',
          location: ' CABA ',
          description: '  Texto  ',
        }),
      ),
      {
        company: 'Acme',
        title: 'Trainee',
        url: 'https://example.com/jobs',
        location: 'CABA',
        modality: null,
        employmentType: null,
        publishedAt: null,
        description: 'Texto',
      },
    )
  })

  it('includes the status only when one was provided', () => {
    assert.equal('status' in normalizeOpportunityInput(createValidInput()), false)
    assert.equal(
      normalizeOpportunityInput(createValidInput({ status: 'saved' })).status,
      'saved',
    )
  })
})

describe('createOpportunityDraft', () => {
  it('creates an empty draft by default', () => {
    assert.deepEqual(createOpportunityDraft(), {
      company: '',
      title: '',
      url: '',
      location: '',
      modality: '',
      employmentType: '',
      publishedAt: '',
      description: '',
      status: '',
    })
  })

  it('copies editable values from an opportunity and maps null to empty strings', () => {
    const draft = createOpportunityDraft(createOpportunity({ modality: 'remote' }))

    assert.equal(draft.company, 'Acme')
    assert.equal(draft.modality, 'remote')
    assert.equal(draft.employmentType, '')
    assert.equal(draft.publishedAt, '')
    assert.equal(draft.status, 'detected')
  })
})
