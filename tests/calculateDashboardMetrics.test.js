import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import calculateDashboardMetrics from '../src/application/calculateDashboardMetrics.js'
import { createOpportunity } from './helpers.js'

// Wednesday 2026-01-07 at local noon; the local week starts on Monday 2026-01-05.
const NOW = new Date(2026, 0, 7, 12, 0, 0)

describe('calculateDashboardMetrics', () => {
  it('returns zero counts and null percentages for an empty collection', () => {
    const metrics = calculateDashboardMetrics({ opportunities: [], now: NOW })

    assert.equal(metrics.totalOpportunities, 0)
    assert.equal(metrics.detectedOpportunities, 0)
    assert.equal(metrics.opportunitiesAddedThisWeek, 0)
    assert.deepEqual(metrics.opportunitiesByStatus.saved, { count: 0, percentage: null })
    assert.deepEqual(metrics.publicationDate.withDate, { count: 0, percentage: null })
  })

  it('counts statuses, modalities, employment types, and publication dates', () => {
    const metrics = calculateDashboardMetrics({
      now: NOW,
      opportunities: [
        createOpportunity({ id: 'a', status: 'detected', modality: 'remote', publishedAt: '2026-01-01' }),
        createOpportunity({ id: 'b', status: 'saved', modality: 'remote', employmentType: 'internship' }),
        createOpportunity({ id: 'c', status: 'saved' }),
        createOpportunity({ id: 'd', status: 'archived', modality: 'hybrid' }),
      ],
    })

    assert.equal(metrics.totalOpportunities, 4)
    assert.equal(metrics.detectedOpportunities, 1)
    assert.deepEqual(metrics.opportunitiesByStatus.saved, { count: 2, percentage: 50 })
    assert.deepEqual(metrics.modality.values.remote, { count: 2, percentage: 50 })
    assert.deepEqual(metrics.modality.unspecified, { count: 1, percentage: 25 })
    assert.deepEqual(metrics.employmentType.values.internship, { count: 1, percentage: 25 })
    assert.deepEqual(metrics.employmentType.unspecified, { count: 3, percentage: 75 })
    assert.deepEqual(metrics.publicationDate.withDate, { count: 1, percentage: 25 })
    assert.deepEqual(metrics.publicationDate.withoutDate, { count: 3, percentage: 75 })
  })

  it('counts only opportunities created between local Monday and now', () => {
    const metrics = calculateDashboardMetrics({
      now: NOW,
      opportunities: [
        createOpportunity({ id: 'monday', detectedAt: new Date(2026, 0, 5, 0, 0, 0).toISOString() }),
        createOpportunity({ id: 'sunday', detectedAt: new Date(2026, 0, 4, 23, 59, 59).toISOString() }),
        createOpportunity({ id: 'future', detectedAt: new Date(2026, 0, 8, 9, 0, 0).toISOString() }),
      ],
    })

    assert.equal(metrics.opportunitiesAddedThisWeek, 1)
  })

  it('does not mutate the input collection', () => {
    const opportunities = [createOpportunity()]
    const snapshot = structuredClone(opportunities)

    calculateDashboardMetrics({ opportunities, now: NOW })
    assert.deepEqual(structuredClone(opportunities), snapshot)
  })
})
