import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import updateOpportunity from '../src/application/updateOpportunity.js'
import JobOpportunity from '../src/domain/JobOpportunity.js'
import { BASE_TIMESTAMP, createOpportunity, createValidInput } from './helpers.js'

const NOW = '2026-01-06T10:00:00.000Z'

describe('updateOpportunity', () => {
  it('replaces only the target and preserves identity metadata', () => {
    const target = createOpportunity({ id: 'a', sourceId: 'source-1' })
    const other = createOpportunity({ id: 'b' })
    const opportunities = [target, other]

    const result = updateOpportunity(opportunities, {
      id: 'a',
      expectedUpdatedAt: BASE_TIMESTAMP,
      changes: createValidInput({ company: '  Nueva  ', modality: 'remote' }),
      now: NOW,
    })

    assert.equal(result.ok, true)
    assert.ok(result.opportunity instanceof JobOpportunity)
    assert.equal(result.opportunity.company, 'Nueva')
    assert.equal(result.opportunity.modality, 'remote')
    assert.equal(result.opportunity.id, 'a')
    assert.equal(result.opportunity.sourceId, 'source-1')
    assert.equal(result.opportunity.createdAt, BASE_TIMESTAMP)
    assert.equal(result.opportunity.detectedAt, BASE_TIMESTAMP)
    assert.equal(result.opportunity.updatedAt, NOW)
    assert.equal(result.opportunities[1], other)
    assert.notEqual(result.opportunities, opportunities)
    assert.equal(opportunities[0], target)
    assert.equal(target.company, 'Acme')
  })

  it('keeps the current status when no status is submitted', () => {
    const result = updateOpportunity([createOpportunity({ status: 'saved' })], {
      id: 'opportunity-1',
      expectedUpdatedAt: BASE_TIMESTAMP,
      changes: createValidInput(),
      now: NOW,
    })

    assert.equal(result.opportunity.status, 'saved')
  })

  it('applies an allowed status change and rejects a forbidden one', () => {
    const opportunities = [createOpportunity({ status: 'saved' })]
    const request = { id: 'opportunity-1', expectedUpdatedAt: BASE_TIMESTAMP, now: NOW }

    assert.equal(
      updateOpportunity(opportunities, {
        ...request,
        changes: createValidInput({ status: 'archived' }),
      }).opportunity.status,
      'archived',
    )
    assert.deepEqual(
      updateOpportunity(opportunities, {
        ...request,
        changes: createValidInput({ status: 'detected' }),
      }),
      { ok: false, status: 'invalid_transition' },
    )
  })

  it('reports conflict, not-found, invalid input, and invalid collection', () => {
    const opportunities = [createOpportunity()]

    assert.equal(
      updateOpportunity(opportunities, {
        id: 'opportunity-1',
        expectedUpdatedAt: 'stale',
        changes: createValidInput(),
      }).status,
      'conflict',
    )
    assert.equal(
      updateOpportunity(opportunities, {
        id: 'missing',
        expectedUpdatedAt: BASE_TIMESTAMP,
        changes: createValidInput(),
      }).status,
      'not_found',
    )

    const invalid = updateOpportunity(opportunities, {
      id: 'opportunity-1',
      expectedUpdatedAt: BASE_TIMESTAMP,
      changes: createValidInput({ url: 'javascript:alert(1)' }),
    })

    assert.equal(invalid.status, 'invalid_input')
    assert.deepEqual(invalid.errors, { url: 'invalid_url' })
    assert.equal(updateOpportunity(null).status, 'invalid_collection')
  })
})
