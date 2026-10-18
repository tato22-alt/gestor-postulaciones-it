import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  findApplicationForOpportunity,
  getApplicationRegistrationBlocker,
} from '../src/domain/applicationRegistrationPolicy.js'
import { createApplication, createOpportunity } from './helpers.js'

describe('getApplicationRegistrationBlocker', () => {
  it('allows detected and saved opportunities without an application', () => {
    assert.equal(getApplicationRegistrationBlocker(createOpportunity({ status: 'detected' }), []), null)
    assert.equal(getApplicationRegistrationBlocker(createOpportunity({ status: 'saved' }), []), null)
  })

  it('blocks dismissed and archived opportunities', () => {
    for (const status of ['dismissed', 'archived']) {
      assert.equal(
        getApplicationRegistrationBlocker(createOpportunity({ status }), []),
        'opportunity_status_not_allowed',
        status,
      )
    }
  })

  it('blocks a second application for the same opportunity', () => {
    assert.equal(
      getApplicationRegistrationBlocker(createOpportunity(), [createApplication()]),
      'already_applied',
    )
  })

  it('ignores applications that belong to other opportunities', () => {
    assert.equal(
      getApplicationRegistrationBlocker(createOpportunity(), [
        createApplication({ opportunityId: 'another' }),
      ]),
      null,
    )
  })

  it('rejects a missing opportunity', () => {
    assert.equal(getApplicationRegistrationBlocker(null, []), 'invalid_opportunity')
  })
})

describe('findApplicationForOpportunity', () => {
  it('finds the application that references the opportunity', () => {
    const application = createApplication()

    assert.equal(findApplicationForOpportunity([application], 'opportunity-1'), application)
    assert.equal(findApplicationForOpportunity([application], 'missing'), null)
    assert.equal(findApplicationForOpportunity(null, 'opportunity-1'), null)
  })
})
