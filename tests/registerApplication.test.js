import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import registerApplication from '../src/application/registerApplication.js'
import Application from '../src/domain/Application.js'
import { BASE_TIMESTAMP, createApplication, createOpportunity } from './helpers.js'

const NOW = '2026-01-06T10:00:00.000Z'

describe('registerApplication', () => {
  it('creates an applied Application linked to the opportunity', () => {
    const opportunity = createOpportunity()
    const applications = []

    const result = registerApplication([opportunity], applications, {
      opportunityId: opportunity.id,
      expectedUpdatedAt: BASE_TIMESTAMP,
      now: NOW,
    })

    assert.equal(result.ok, true)
    assert.ok(result.application instanceof Application)
    assert.equal(result.application.opportunityId, opportunity.id)
    assert.equal(result.application.status, 'applied')
    assert.equal(result.application.appliedAt, NOW)
    assert.equal(result.application.createdAt, NOW)
    assert.equal(result.application.updatedAt, NOW)
    assert.equal(result.application.followUpAt, null)
    assert.deepEqual(result.applications, [result.application])
    assert.equal(applications.length, 0)
  })

  it('does not change the opportunity', () => {
    const opportunity = createOpportunity({ status: 'saved' })
    const snapshot = { ...opportunity }

    registerApplication([opportunity], [], {
      opportunityId: opportunity.id,
      expectedUpdatedAt: BASE_TIMESTAMP,
      now: NOW,
    })

    assert.deepEqual({ ...opportunity }, snapshot)
  })

  it('rejects a second application for the same opportunity', () => {
    const existing = createApplication()
    const result = registerApplication([createOpportunity()], [existing], {
      opportunityId: 'opportunity-1',
      expectedUpdatedAt: BASE_TIMESTAMP,
    })

    assert.deepEqual(result, { ok: false, status: 'already_applied' })
  })

  it('rejects dismissed and archived opportunities', () => {
    for (const status of ['dismissed', 'archived']) {
      assert.equal(
        registerApplication([createOpportunity({ status })], [], {
          opportunityId: 'opportunity-1',
          expectedUpdatedAt: BASE_TIMESTAMP,
        }).status,
        'opportunity_status_not_allowed',
      )
    }
  })

  it('rejects an opportunity that changed since confirmation started', () => {
    assert.deepEqual(
      registerApplication([createOpportunity()], [], {
        opportunityId: 'opportunity-1',
        expectedUpdatedAt: '2026-01-01T00:00:00.000Z',
      }),
      { ok: false, status: 'conflict' },
    )
  })

  it('reports missing opportunities, invalid collections, and invalid clocks', () => {
    assert.equal(
      registerApplication([], [], { opportunityId: 'missing' }).status,
      'not_found',
    )
    assert.equal(registerApplication(null, []).status, 'invalid_collection')
    assert.equal(registerApplication([], null).status, 'invalid_collection')
    assert.equal(
      registerApplication([createOpportunity()], [], {
        opportunityId: 'opportunity-1',
        expectedUpdatedAt: BASE_TIMESTAMP,
        now: 'not-a-date',
      }).status,
      'invalid_timestamp',
    )
  })
})
