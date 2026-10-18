import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import getPendingFollowUps from '../src/application/getPendingFollowUps.js'
import { createApplication, createOpportunity } from './helpers.js'

const NOW = new Date(2026, 0, 10, 12, 0)

describe('getPendingFollowUps', () => {
  it('lists scheduled follow-ups sorted by date with urgency and opportunity', () => {
    const opportunity = createOpportunity({ id: 'o1' })
    const result = getPendingFollowUps({
      now: NOW,
      opportunities: [opportunity],
      applications: [
        createApplication({ id: 'a1', opportunityId: 'o1', followUpAt: '2026-01-15' }),
        createApplication({ id: 'a2', opportunityId: 'o2', followUpAt: '2026-01-08', status: 'interview' }),
        createApplication({ id: 'a3', opportunityId: 'o3', followUpAt: '2026-01-10', status: 'technical_test' }),
        createApplication({ id: 'a4', opportunityId: 'o4', followUpAt: null }),
      ],
    })

    assert.deepEqual(
      result.map((item) => [item.application.id, item.urgency]),
      [['a2', 'overdue'], ['a3', 'today'], ['a1', 'upcoming']],
    )
    assert.equal(result[2].opportunity, opportunity)
    assert.equal(result[0].opportunity, null)
  })

  it('ignores follow-ups on final applications', () => {
    const result = getPendingFollowUps({
      now: NOW,
      opportunities: [],
      applications: [createApplication({ status: 'offer', followUpAt: '2026-01-01' })],
    })

    assert.deepEqual(result, [])
  })
})
