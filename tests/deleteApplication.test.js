import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import deleteApplication from '../src/application/deleteApplication.js'
import { BASE_TIMESTAMP, createApplication } from './helpers.js'

describe('deleteApplication', () => {
  it('removes only the target without mutating the input', () => {
    const first = createApplication({ id: 'a', opportunityId: 'o1' })
    const second = createApplication({ id: 'b', opportunityId: 'o2' })
    const applications = [first, second]
    const result = deleteApplication(applications, { id: 'a', expectedUpdatedAt: BASE_TIMESTAMP })

    assert.equal(result.ok, true)
    assert.deepEqual(result.applications, [second])
    assert.equal(applications.length, 2)
  })

  it('reports conflict, not-found, and invalid collections', () => {
    const applications = [createApplication()]

    assert.equal(deleteApplication(applications, { id: 'application-1', expectedUpdatedAt: 'stale' }).status, 'conflict')
    assert.equal(deleteApplication(applications, { id: 'missing' }).status, 'not_found')
    assert.equal(deleteApplication(null).status, 'invalid_collection')
  })
})
