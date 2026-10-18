import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import completeFollowUp from '../src/application/completeFollowUp.js'
import { BASE_TIMESTAMP, createApplication } from './helpers.js'

describe('completeFollowUp', () => {
  it('clears the follow-up immutably and advances updatedAt', () => {
    const application = createApplication({ followUpAt: '2026-01-12', nextAction: 'Llamar' })
    const result = completeFollowUp([application], {
      id: application.id,
      expectedUpdatedAt: BASE_TIMESTAMP,
      now: '2026-01-12T10:00:00.000Z',
    })

    assert.equal(result.ok, true)
    assert.equal(result.application.followUpAt, null)
    assert.equal(result.application.nextAction, 'Llamar')
    assert.equal(result.application.updatedAt, '2026-01-12T10:00:00.000Z')
    assert.equal(application.followUpAt, '2026-01-12')
  })

  it('reports a missing follow-up, conflict, not-found, and invalid collection', () => {
    assert.equal(
      completeFollowUp([createApplication()], { id: 'application-1', expectedUpdatedAt: BASE_TIMESTAMP }).status,
      'no_follow_up',
    )
    assert.equal(
      completeFollowUp([createApplication({ followUpAt: '2026-01-12' })], {
        id: 'application-1',
        expectedUpdatedAt: 'stale',
      }).status,
      'conflict',
    )
    assert.equal(completeFollowUp([], { id: 'x' }).status, 'not_found')
    assert.equal(completeFollowUp(null).status, 'invalid_collection')
  })
})
