import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import updateApplicationDetails from '../src/application/updateApplicationDetails.js'
import Application from '../src/domain/Application.js'
import { toLocalDateString } from '../src/utils/date.js'
import { createApplication } from './helpers.js'

const APPLIED_AT = new Date(2026, 0, 5, 15, 30).toISOString()
const NOW = new Date(2026, 0, 10, 12, 0)
const base = () => createApplication({ appliedAt: APPLIED_AT, createdAt: APPLIED_AT, updatedAt: APPLIED_AT })
const changes = (overrides = {}) => ({
  appliedDate: '2026-01-05',
  followUpDate: '2026-01-12',
  nextAction: '  Escribir al reclutador ',
  notes: 'Notas',
  ...overrides,
})

describe('updateApplicationDetails', () => {
  it('updates details immutably and keeps the exact applied timestamp when the day is unchanged', () => {
    const application = base()
    const result = updateApplicationDetails([application], {
      id: application.id,
      expectedUpdatedAt: APPLIED_AT,
      changes: changes(),
      now: NOW,
    })

    assert.equal(result.ok, true)
    assert.ok(result.application instanceof Application)
    assert.equal(result.application.appliedAt, APPLIED_AT)
    assert.equal(result.application.followUpAt, '2026-01-12')
    assert.equal(result.application.nextAction, 'Escribir al reclutador')
    assert.equal(result.application.notes, 'Notas')
    assert.equal(result.application.status, 'applied')
    assert.equal(result.application.updatedAt, NOW.toISOString())
    assert.equal(application.notes, '')
  })

  it('moves the applied date to the start of the chosen local day', () => {
    const result = updateApplicationDetails([base()], {
      id: 'application-1',
      expectedUpdatedAt: APPLIED_AT,
      changes: changes({ appliedDate: '2026-01-02' }),
      now: NOW,
    })

    assert.equal(toLocalDateString(result.application.appliedAt), '2026-01-02')
    assert.equal(new Date(result.application.appliedAt).getHours(), 0)
  })

  it('clears the follow-up when the date is emptied', () => {
    const result = updateApplicationDetails([base()], {
      id: 'application-1',
      expectedUpdatedAt: APPLIED_AT,
      changes: changes({ followUpDate: '' }),
      now: NOW,
    })

    assert.equal(result.application.followUpAt, null)
  })

  it('reports invalid input, conflict, not-found, and invalid collections', () => {
    const invalid = updateApplicationDetails([base()], {
      id: 'application-1',
      expectedUpdatedAt: APPLIED_AT,
      changes: changes({ appliedDate: '2026-01-11' }),
      now: NOW,
    })

    assert.equal(invalid.status, 'invalid_input')
    assert.deepEqual(invalid.errors, { appliedDate: 'future_date' })
    assert.equal(
      updateApplicationDetails([base()], { id: 'application-1', expectedUpdatedAt: 'stale', changes: changes() }).status,
      'conflict',
    )
    assert.equal(updateApplicationDetails([base()], { id: 'missing' }).status, 'not_found')
    assert.equal(updateApplicationDetails(null).status, 'invalid_collection')
  })

  it('rejects a follow-up on a final application', () => {
    const offer = createApplication({ status: 'offer', appliedAt: APPLIED_AT, updatedAt: APPLIED_AT })
    const result = updateApplicationDetails([offer], {
      id: offer.id,
      expectedUpdatedAt: APPLIED_AT,
      changes: changes(),
      now: NOW,
    })

    assert.deepEqual(result.errors, { followUpDate: 'not_allowed' })
  })
})
