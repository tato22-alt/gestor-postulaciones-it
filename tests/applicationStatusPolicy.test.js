import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  canTransitionApplicationStatus,
  getAllowedApplicationTargetStatuses,
  isFinalApplicationStatus,
} from '../src/domain/applicationStatusPolicy.js'

const STATUSES = ['applied', 'interview', 'technical_test', 'offer', 'rejected']

// Approved by Luciano: applied → interview | technical_test | rejected;
// interview ↔ technical_test; both → offer | rejected; offer and rejected are final.
const EXPECTED_ALLOWED = {
  applied: ['interview', 'technical_test', 'rejected'],
  interview: ['technical_test', 'offer', 'rejected'],
  technical_test: ['interview', 'offer', 'rejected'],
  offer: [],
  rejected: [],
}

describe('applicationStatusPolicy', () => {
  for (const from of STATUSES) {
    for (const to of STATUSES) {
      const expected = EXPECTED_ALLOWED[from].includes(to)

      it(`${from} → ${to} is ${expected ? 'allowed' : 'rejected'}`, () => {
        assert.equal(canTransitionApplicationStatus(from, to), expected)
      })
    }
  }

  it('rejects unknown statuses, including opportunity statuses', () => {
    assert.equal(canTransitionApplicationStatus('saved', 'interview'), false)
    assert.equal(canTransitionApplicationStatus('applied', 'saved'), false)
  })

  it('identifies offer and rejected as the only final statuses', () => {
    assert.deepEqual(STATUSES.filter(isFinalApplicationStatus), ['offer', 'rejected'])
    assert.equal(isFinalApplicationStatus('unknown'), false)
  })

  it('returns labelled target statuses in policy order', () => {
    const targets = getAllowedApplicationTargetStatuses('applied')

    assert.deepEqual(targets.map((status) => status.value), ['interview', 'technical_test', 'rejected'])
    assert.ok(targets.every((status) => status.label))
    assert.deepEqual(getAllowedApplicationTargetStatuses('offer'), [])
  })
})
