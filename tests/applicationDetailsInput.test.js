import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  createApplicationDetailsDraft,
  normalizeApplicationDetailsInput,
  validateApplicationDetailsInput,
} from '../src/application/applicationDetailsInput.js'
import { createApplication } from './helpers.js'

const TODAY = '2026-01-10'
const valid = (overrides = {}) => ({
  appliedDate: '2026-01-05',
  followUpDate: '2026-01-12',
  nextAction: '',
  notes: '',
  ...overrides,
})
const validate = (input, status = 'applied') =>
  validateApplicationDetailsInput(input, { status, today: TODAY })

describe('validateApplicationDetailsInput', () => {
  it('accepts valid details and an empty follow-up', () => {
    assert.deepEqual(validate(valid()), {})
    assert.deepEqual(validate(valid({ followUpDate: '' })), {})
  })

  it('requires a real, non-future applied date', () => {
    assert.deepEqual(validate(valid({ appliedDate: '' })), { appliedDate: 'required' })
    assert.deepEqual(validate(valid({ appliedDate: '2026-02-30' })), { appliedDate: 'invalid_date' })
    assert.deepEqual(validate(valid({ appliedDate: '2026-01-11' })), { appliedDate: 'future_date' })
    assert.deepEqual(validate(valid({ appliedDate: TODAY })), {})
  })

  it('rejects a follow-up before the applied date or an invalid follow-up', () => {
    assert.deepEqual(validate(valid({ followUpDate: '2026-01-04' })), { followUpDate: 'before_applied_date' })
    assert.deepEqual(validate(valid({ followUpDate: '12/01/2026' })), { followUpDate: 'invalid_date' })
  })

  it('allows an overdue follow-up date on or after the applied date', () => {
    assert.deepEqual(validate(valid({ followUpDate: '2026-01-06' })), {})
  })

  it('rejects a follow-up for final statuses but allows other edits', () => {
    assert.deepEqual(validate(valid(), 'offer'), { followUpDate: 'not_allowed' })
    assert.deepEqual(validate(valid({ followUpDate: '', notes: 'ok' }), 'rejected'), {})
  })

  it('enforces text limits after trimming', () => {
    assert.deepEqual(validate(valid({ nextAction: 'a'.repeat(201) })), { nextAction: 'too_long' })
    assert.deepEqual(validate(valid({ nextAction: ` ${'a'.repeat(200)} ` })), {})
    assert.deepEqual(validate(valid({ notes: 'a'.repeat(2001) })), { notes: 'too_long' })
    assert.deepEqual(validate(valid({ notes: null })), { notes: 'invalid_text' })
  })
})

describe('normalizeApplicationDetailsInput', () => {
  it('trims text and converts an empty follow-up to null', () => {
    assert.deepEqual(
      normalizeApplicationDetailsInput(valid({ followUpDate: '', nextAction: '  Escribir  ', notes: ' n ' })),
      { appliedDate: '2026-01-05', followUpDate: null, nextAction: 'Escribir', notes: 'n' },
    )
  })
})

describe('createApplicationDetailsDraft', () => {
  it('maps stored values to form values', () => {
    const draft = createApplicationDetailsDraft(
      createApplication({ appliedAt: new Date(2026, 0, 5, 12).toISOString(), followUpAt: null, notes: 'x' }),
    )

    assert.deepEqual(draft, { appliedDate: '2026-01-05', followUpDate: '', nextAction: '', notes: 'x' })
  })
})
