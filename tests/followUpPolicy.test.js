import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  canHaveFollowUp,
  getFollowUpUrgency,
  getSuggestedFollowUpDate,
} from '../src/domain/followUpPolicy.js'

// Local noon avoids any time zone moving the calendar day.
const FROM = new Date(2026, 0, 5, 12, 0, 0)

describe('followUpPolicy', () => {
  it('suggests 7, 3, and 5 days for applied, interview, and technical test', () => {
    assert.equal(getSuggestedFollowUpDate('applied', FROM), '2026-01-12')
    assert.equal(getSuggestedFollowUpDate('interview', FROM), '2026-01-08')
    assert.equal(getSuggestedFollowUpDate('technical_test', FROM), '2026-01-10')
  })

  it('suggests no follow-up for final or unknown statuses', () => {
    for (const status of ['offer', 'rejected', 'saved', undefined]) {
      assert.equal(getSuggestedFollowUpDate(status, FROM), null, String(status))
      assert.equal(canHaveFollowUp(status), false, String(status))
    }
  })

  it('returns null for an invalid starting date', () => {
    assert.equal(getSuggestedFollowUpDate('applied', 'not-a-date'), null)
  })

  it('classifies urgency against the local date', () => {
    assert.equal(getFollowUpUrgency('2026-01-04', '2026-01-05'), 'overdue')
    assert.equal(getFollowUpUrgency('2026-01-05', '2026-01-05'), 'today')
    assert.equal(getFollowUpUrgency('2026-01-06', '2026-01-05'), 'upcoming')
    assert.equal(getFollowUpUrgency('2025-12-31', '2026-01-01'), 'overdue')
  })
})
