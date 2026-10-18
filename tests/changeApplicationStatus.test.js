import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import changeApplicationStatus from '../src/application/changeApplicationStatus.js'
import Application from '../src/domain/Application.js'
import { addDaysToDateString, toLocalDateString } from '../src/utils/date.js'
import { BASE_TIMESTAMP, createApplication } from './helpers.js'

const NOW = '2026-01-06T10:00:00.000Z'

describe('changeApplicationStatus', () => {
  it('applies an allowed transition immutably', () => {
    const application = createApplication()
    const other = createApplication({ id: 'application-2', opportunityId: 'opportunity-2' })
    const applications = [application, other]

    const result = changeApplicationStatus(applications, {
      id: application.id,
      nextStatus: 'interview',
      expectedUpdatedAt: BASE_TIMESTAMP,
      now: NOW,
    })

    assert.equal(result.ok, true)
    assert.ok(result.application instanceof Application)
    assert.equal(result.application.status, 'interview')
    assert.equal(result.application.updatedAt, NOW)
    assert.equal(result.application.appliedAt, BASE_TIMESTAMP)
    assert.equal(result.application.opportunityId, 'opportunity-1')
    assert.equal(result.applications[1], other)
    assert.notEqual(result.applications, applications)
    assert.equal(application.status, 'applied')
  })

  it('re-suggests the follow-up for the new status and clears it for final statuses', () => {
    const application = createApplication({ followUpAt: '2026-01-01' })
    const request = { id: application.id, expectedUpdatedAt: BASE_TIMESTAMP, now: NOW }
    const today = toLocalDateString(NOW)

    assert.equal(
      changeApplicationStatus([application], { ...request, nextStatus: 'interview' }).application.followUpAt,
      addDaysToDateString(today, 3),
    )
    assert.equal(
      changeApplicationStatus([application], { ...request, nextStatus: 'technical_test' }).application.followUpAt,
      addDaysToDateString(today, 5),
    )
    assert.equal(
      changeApplicationStatus([application], { ...request, nextStatus: 'rejected' }).application.followUpAt,
      null,
    )
  })

  it('keeps updatedAt monotonic when the clock is behind', () => {
    const result = changeApplicationStatus([createApplication()], {
      id: 'application-1',
      nextStatus: 'rejected',
      expectedUpdatedAt: BASE_TIMESTAMP,
      now: '2020-01-01T00:00:00.000Z',
    })

    assert.equal(result.application.updatedAt, '2026-01-05T10:00:00.001Z')
  })

  it('rejects transitions out of final statuses', () => {
    for (const status of ['offer', 'rejected']) {
      assert.deepEqual(
        changeApplicationStatus([createApplication({ status })], {
          id: 'application-1',
          nextStatus: 'interview',
          expectedUpdatedAt: BASE_TIMESTAMP,
        }),
        { ok: false, status: 'invalid_transition' },
      )
    }
  })

  it('rejects applied → offer', () => {
    assert.equal(
      changeApplicationStatus([createApplication()], {
        id: 'application-1',
        nextStatus: 'offer',
        expectedUpdatedAt: BASE_TIMESTAMP,
      }).status,
      'invalid_transition',
    )
  })

  it('reports conflict, not-found, and invalid collections', () => {
    assert.equal(
      changeApplicationStatus([createApplication()], {
        id: 'application-1',
        nextStatus: 'interview',
        expectedUpdatedAt: 'stale',
      }).status,
      'conflict',
    )
    assert.equal(
      changeApplicationStatus([createApplication()], { id: 'missing' }).status,
      'not_found',
    )
    assert.equal(changeApplicationStatus(null).status, 'invalid_collection')
  })
})
