import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import calculateApplicationMetrics from '../src/application/calculateApplicationMetrics.js'
import { createApplication } from './helpers.js'

describe('calculateApplicationMetrics', () => {
  it('returns zero counts and null percentages without applications', () => {
    const metrics = calculateApplicationMetrics({ applications: [] })

    assert.equal(metrics.totalApplications, 0)
    assert.equal(metrics.activeApplications, 0)
    assert.deepEqual(metrics.applicationsByStatus.applied, { count: 0, percentage: null })
  })

  it('counts statuses and treats only non-final statuses as active', () => {
    const statuses = ['applied', 'interview', 'technical_test', 'offer', 'rejected', 'rejected']
    const metrics = calculateApplicationMetrics({
      applications: statuses.map((status, index) =>
        createApplication({ id: `a${index}`, opportunityId: `o${index}`, status }),
      ),
    })

    assert.equal(metrics.totalApplications, 6)
    assert.equal(metrics.activeApplications, 3)
    assert.deepEqual(metrics.applicationsByStatus.rejected, { count: 2, percentage: 33 })
    assert.deepEqual(metrics.applicationsByStatus.offer, { count: 1, percentage: 17 })
  })
})
