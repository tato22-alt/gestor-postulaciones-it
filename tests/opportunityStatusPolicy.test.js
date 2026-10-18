import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  canTransitionOpportunityStatus,
  getAllowedTargetStatuses,
} from '../src/domain/opportunityStatusPolicy.js'

const STATUSES = ['detected', 'saved', 'dismissed', 'archived']

const EXPECTED_ALLOWED = {
  detected: ['saved', 'dismissed', 'archived'],
  saved: ['dismissed', 'archived'],
  dismissed: ['saved', 'archived'],
  archived: ['detected', 'saved', 'dismissed'],
}

describe('opportunityStatusPolicy', () => {
  for (const from of STATUSES) {
    for (const to of STATUSES) {
      const expected = EXPECTED_ALLOWED[from].includes(to)

      it(`${from} → ${to} is ${expected ? 'allowed' : 'rejected'}`, () => {
        assert.equal(canTransitionOpportunityStatus(from, to), expected)
      })
    }
  }

  it('rejects unknown source and target statuses', () => {
    assert.equal(canTransitionOpportunityStatus('applied', 'saved'), false)
    assert.equal(canTransitionOpportunityStatus('detected', 'applied'), false)
    assert.equal(canTransitionOpportunityStatus(undefined, 'saved'), false)
  })

  it('returns status objects with labels for allowed targets', () => {
    assert.deepEqual(
      getAllowedTargetStatuses('saved').map((status) => status.value),
      ['dismissed', 'archived'],
    )
    assert.ok(getAllowedTargetStatuses('saved').every((status) => status.label))
  })

  it('returns no targets for an unknown status', () => {
    assert.deepEqual(getAllowedTargetStatuses('unknown'), [])
  })
})
