import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  addDaysToDateString,
  isValidDateString,
  localDateStringToTimestamp,
  toLocalDateString,
} from '../src/utils/date.js'

describe('date utilities', () => {
  it('validates real calendar dates only', () => {
    assert.equal(isValidDateString('2024-02-29'), true)
    for (const value of ['2026-02-29', '2026-13-01', '2026-1-01', '01/02/2026', '', null, 20260101]) {
      assert.equal(isValidDateString(value), false, String(value))
    }
  })

  it('adds days across month and year boundaries', () => {
    assert.equal(addDaysToDateString('2026-01-30', 3), '2026-02-02')
    assert.equal(addDaysToDateString('2026-12-29', 7), '2027-01-05')
    assert.equal(addDaysToDateString('2024-02-27', 3), '2024-03-01')
  })

  it('keeps years below 100 instead of mapping them to 19xx', () => {
    assert.equal(toLocalDateString(localDateStringToTimestamp('0050-03-01')), '0050-03-01')
  })

  it('converts between local calendar days and timestamps', () => {
    const timestamp = localDateStringToTimestamp('2026-03-15')

    assert.equal(toLocalDateString(timestamp), '2026-03-15')
    assert.equal(toLocalDateString(new Date(2026, 0, 5, 23, 59)), '2026-01-05')
    assert.equal(toLocalDateString('not-a-date'), null)
  })
})
