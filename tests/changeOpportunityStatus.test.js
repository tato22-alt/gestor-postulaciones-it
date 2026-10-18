import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import changeOpportunityStatus from '../src/application/changeOpportunityStatus.js'
import JobOpportunity from '../src/domain/JobOpportunity.js'
import { BASE_TIMESTAMP, createOpportunity } from './helpers.js'

describe('changeOpportunityStatus', () => {
  it('applies an allowed transition and returns a new domain instance', () => {
    const opportunity = createOpportunity()
    const result = changeOpportunityStatus(opportunity, {
      nextStatus: 'saved',
      expectedUpdatedAt: BASE_TIMESTAMP,
      now: '2026-01-06T10:00:00.000Z',
    })

    assert.equal(result.ok, true)
    assert.ok(result.opportunity instanceof JobOpportunity)
    assert.notEqual(result.opportunity, opportunity)
    assert.equal(result.opportunity.status, 'saved')
    assert.equal(result.opportunity.updatedAt, '2026-01-06T10:00:00.000Z')
    assert.equal(result.opportunity.createdAt, BASE_TIMESTAMP)
    assert.equal(opportunity.status, 'detected')
  })

  it('keeps updatedAt monotonic when the clock is behind', () => {
    const result = changeOpportunityStatus(createOpportunity(), {
      nextStatus: 'saved',
      expectedUpdatedAt: BASE_TIMESTAMP,
      now: '2020-01-01T00:00:00.000Z',
    })

    assert.equal(result.opportunity.updatedAt, '2026-01-05T10:00:00.001Z')
  })

  it('rejects a stale expected version', () => {
    assert.deepEqual(
      changeOpportunityStatus(createOpportunity(), {
        nextStatus: 'saved',
        expectedUpdatedAt: '2026-01-01T00:00:00.000Z',
      }),
      { ok: false, status: 'conflict' },
    )
  })

  it('rejects forbidden and self transitions', () => {
    const saved = createOpportunity({ status: 'saved' })

    for (const nextStatus of ['detected', 'saved', 'applied']) {
      assert.deepEqual(
        changeOpportunityStatus(saved, { nextStatus, expectedUpdatedAt: BASE_TIMESTAMP }),
        { ok: false, status: 'invalid_transition' },
        nextStatus,
      )
    }
  })

  it('rejects an invalid opportunity or clock', () => {
    assert.equal(changeOpportunityStatus(null).status, 'invalid_opportunity')
    assert.equal(
      changeOpportunityStatus(createOpportunity(), {
        nextStatus: 'saved',
        expectedUpdatedAt: BASE_TIMESTAMP,
        now: 'not-a-date',
      }).status,
      'invalid_timestamp',
    )
  })
})
