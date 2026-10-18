import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import deleteOpportunity from '../src/application/deleteOpportunity.js'
import { BASE_TIMESTAMP, createOpportunity } from './helpers.js'

describe('deleteOpportunity', () => {
  it('removes only the target without mutating the input', () => {
    const first = createOpportunity({ id: 'a' })
    const second = createOpportunity({ id: 'b' })
    const third = createOpportunity({ id: 'c' })
    const opportunities = [first, second, third]

    const result = deleteOpportunity(opportunities, { id: 'b', expectedUpdatedAt: BASE_TIMESTAMP })

    assert.equal(result.ok, true)
    assert.deepEqual(result.opportunities, [first, third])
    assert.equal(result.opportunities[0], first)
    assert.equal(opportunities.length, 3)
  })

  it('reports a missing target', () => {
    assert.deepEqual(
      deleteOpportunity([createOpportunity()], { id: 'missing', expectedUpdatedAt: BASE_TIMESTAMP }),
      { ok: false, status: 'not_found' },
    )
  })

  it('refuses to delete a record that changed since confirmation started', () => {
    assert.deepEqual(
      deleteOpportunity([createOpportunity()], {
        id: 'opportunity-1',
        expectedUpdatedAt: '2026-01-01T00:00:00.000Z',
      }),
      { ok: false, status: 'conflict' },
    )
  })

  it('rejects non-array collections', () => {
    for (const value of [null, undefined, {}, 'text', 1]) {
      assert.deepEqual(deleteOpportunity(value, { id: 'a' }), {
        ok: false,
        status: 'invalid_collection',
      })
    }
  })
})
