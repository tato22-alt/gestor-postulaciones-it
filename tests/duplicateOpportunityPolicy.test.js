import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  findOpportunityWithSameUrl,
  normalizeUrlForComparison,
} from '../src/domain/duplicateOpportunityPolicy.js'
import { createOpportunity } from './helpers.js'

describe('duplicateOpportunityPolicy', () => {
  it('ignores host case, fragments, and a trailing slash', () => {
    const expected = 'https://example.com/jobs/1?ref=a'

    assert.equal(normalizeUrlForComparison('HTTPS://Example.COM/jobs/1/?ref=a#apply'), expected)
    assert.equal(normalizeUrlForComparison('https://example.com/jobs/1?ref=a'), expected)
  })

  it('keeps path case, query, and protocol significant', () => {
    assert.notEqual(normalizeUrlForComparison('https://x.com/Jobs'), normalizeUrlForComparison('https://x.com/jobs'))
    assert.notEqual(normalizeUrlForComparison('https://x.com/a?id=1'), normalizeUrlForComparison('https://x.com/a?id=2'))
    assert.notEqual(normalizeUrlForComparison('http://x.com/a'), normalizeUrlForComparison('https://x.com/a'))
    assert.equal(normalizeUrlForComparison('not a url'), null)
  })

  it('finds another opportunity with the same URL, excluding the one being edited', () => {
    const existing = createOpportunity({ id: 'a', url: 'https://example.com/jobs/1' })

    assert.equal(findOpportunityWithSameUrl([existing], 'https://EXAMPLE.com/jobs/1/'), existing)
    assert.equal(findOpportunityWithSameUrl([existing], 'https://example.com/jobs/1', 'a'), null)
    assert.equal(findOpportunityWithSameUrl([existing], 'https://example.com/jobs/2'), null)
  })
})
