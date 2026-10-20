import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import mergeSnapshots from '../src/application/mergeSnapshots.js'
import Application from '../src/domain/Application.js'
import CompanySource from '../src/domain/CompanySource.js'
import JobOpportunity from '../src/domain/JobOpportunity.js'
import { createApplication, createOpportunity } from './helpers.js'

const T = (minute) => `2026-01-10T10:${String(minute).padStart(2, '0')}:00.000Z`
const empty = () => ({ opportunities: [], applications: [], sources: [], deletions: [] })
const snapshot = (overrides) => ({ ...empty(), ...overrides })
const opp = (id, minute, extra = {}) =>
  createOpportunity({ id, detectedAt: T(0), createdAt: T(0), updatedAt: T(minute), ...extra })
const source = (id, minute) =>
  new CompanySource({ id, companyName: id, careersUrl: `https://${id}.com`, status: 'approved', discoveredAt: T(0), updatedAt: T(minute) })

describe('mergeSnapshots', () => {
  it('combines records that exist on only one side, keeping local order first', () => {
    const result = mergeSnapshots(
      snapshot({ opportunities: [opp('a', 1)] }),
      snapshot({ opportunities: [opp('b', 1)] }),
    )

    assert.deepEqual(result.opportunities.map((o) => o.id), ['a', 'b'])
    assert.equal(result.changedLocal, true)
    assert.equal(result.changedRemote, true)
  })

  it('keeps the most recent edit of the same record', () => {
    const local = opp('a', 5, { company: 'Local' })
    const remote = opp('a', 7, { company: 'Remota' })

    assert.equal(mergeSnapshots(snapshot({ opportunities: [local] }), snapshot({ opportunities: [remote] })).opportunities[0].company, 'Remota')
    assert.equal(mergeSnapshots(snapshot({ opportunities: [remote] }), snapshot({ opportunities: [local] })).opportunities[0].company, 'Remota')
  })

  it('picks the same copy on an exact tie from both devices', () => {
    const first = snapshot({ opportunities: [opp('a', 5, { company: 'Alfa' })] })
    const second = snapshot({ opportunities: [opp('a', 5, { company: 'Beta' })] })

    assert.equal(
      mergeSnapshots(first, second).opportunities[0].company,
      mergeSnapshots(second, first).opportunities[0].company,
    )
  })

  it('ignores a different order of the same records', () => {
    const result = mergeSnapshots(
      snapshot({ opportunities: [opp('a', 1), opp('b', 1)] }),
      snapshot({ opportunities: [opp('b', 1), opp('a', 1)] }),
    )

    assert.equal(result.changedLocal, false)
    assert.equal(result.changedRemote, false)
  })

  it('keeps an opportunity that still has an application on another device', () => {
    const application = createApplication({ id: 'x', opportunityId: 'o', updatedAt: T(8) })
    const result = mergeSnapshots(
      snapshot({ deletions: [{ collection: 'opportunities', id: 'o', deletedAt: T(5) }] }),
      snapshot({ opportunities: [opp('o', 1)], applications: [application] }),
    )

    assert.deepEqual(result.opportunities.map((o) => o.id), ['o'])
    assert.deepEqual(result.applications.map((a) => a.id), ['x'])
    assert.deepEqual(result.deletions, [])
  })

  it('reports no changes when both sides are equal', () => {
    const data = snapshot({ opportunities: [opp('a', 1)], deletions: [{ collection: 'sources', id: 'x', deletedAt: T(2) }] })
    const result = mergeSnapshots(data, structuredClone(data))

    assert.equal(result.changedLocal, false)
    assert.equal(result.changedRemote, false)
  })

  it('applies a deletion made after the last edit, on both sides', () => {
    const deletion = { collection: 'opportunities', id: 'a', deletedAt: T(9) }
    const result = mergeSnapshots(
      snapshot({ opportunities: [opp('a', 5)] }),
      snapshot({ deletions: [deletion] }),
    )

    assert.deepEqual(result.opportunities, [])
    assert.deepEqual(result.deletions, [deletion])
    assert.equal(result.changedLocal, true)
    assert.equal(result.changedRemote, false)
  })

  it('keeps a record edited after it was deleted elsewhere and drops that deletion', () => {
    const result = mergeSnapshots(
      snapshot({ opportunities: [opp('a', 9)] }),
      snapshot({ deletions: [{ collection: 'opportunities', id: 'a', deletedAt: T(5) }] }),
    )

    assert.deepEqual(result.opportunities.map((o) => o.id), ['a'])
    assert.deepEqual(result.deletions, [])
  })

  it('keeps the latest deletion when both sides recorded one', () => {
    const result = mergeSnapshots(
      snapshot({ deletions: [{ collection: 'applications', id: 'x', deletedAt: T(3) }] }),
      snapshot({ deletions: [{ collection: 'applications', id: 'x', deletedAt: T(4) }] }),
    )

    assert.equal(result.deletions[0].deletedAt, T(4))
  })

  it('does not confuse deletions across collections with the same id', () => {
    const result = mergeSnapshots(
      snapshot({ opportunities: [opp('same', 1)] }),
      snapshot({ deletions: [{ collection: 'sources', id: 'same', deletedAt: T(5) }] }),
    )

    assert.deepEqual(result.opportunities.map((o) => o.id), ['same'])
  })

  it('resolves two applications edited at the same time identically on both devices', () => {
    const first = createApplication({ id: 'first', opportunityId: 'o', updatedAt: T(4) })
    const second = createApplication({ id: 'second', opportunityId: 'o', updatedAt: T(4) })
    const a = snapshot({ opportunities: [opp('o', 1)], applications: [first] })
    const b = snapshot({ opportunities: [opp('o', 1)], applications: [second] })

    assert.deepEqual(
      mergeSnapshots(a, b).applications.map((x) => x.id),
      mergeSnapshots(b, a).applications.map((x) => x.id),
    )
  })

  it('resolves two applications for one opportunity by keeping the most recent', () => {
    const older = createApplication({ id: 'older', opportunityId: 'o', updatedAt: T(2) })
    const newer = createApplication({ id: 'newer', opportunityId: 'o', updatedAt: T(6) })
    const result = mergeSnapshots(
      snapshot({ opportunities: [opp('o', 1)], applications: [older] }),
      snapshot({ opportunities: [opp('o', 1)], applications: [newer] }),
    )

    assert.deepEqual(result.applications.map((a) => a.id), ['newer'])
    assert.deepEqual(result.deletions, [{ collection: 'applications', id: 'older', deletedAt: T(2) }])
    assert.equal(result.duplicateApplicationsResolved, 1)

    const again = mergeSnapshots(
      snapshot({ opportunities: [opp('o', 1)], applications: [older] }),
      { ...result, applications: result.applications },
    )

    assert.deepEqual(again.applications.map((a) => a.id), ['newer'])
  })

  it('removes the reference to a source that was deleted elsewhere', () => {
    const result = mergeSnapshots(
      snapshot({ sources: [source('s', 1)], opportunities: [opp('o', 1, { sourceId: 's' })] }),
      snapshot({ deletions: [{ collection: 'sources', id: 's', deletedAt: T(5) }] }),
    )

    assert.deepEqual(result.sources, [])
    assert.equal(result.opportunities[0].sourceId, null)
  })

  it('returns domain instances and converges from both directions', () => {
    const a = snapshot({ opportunities: [opp('a', 3)], applications: [createApplication({ id: 'x', opportunityId: 'a', updatedAt: T(4) })] })
    const b = snapshot({ opportunities: [opp('a', 6), opp('b', 1)], deletions: [{ collection: 'applications', id: 'x', deletedAt: T(5) }] })
    const ab = mergeSnapshots(a, b)
    const ba = mergeSnapshots(b, a)

    assert.ok(ab.opportunities.every((o) => o instanceof JobOpportunity))
    assert.ok(ab.applications.every((x) => x instanceof Application))
    assert.deepEqual(ab.applications, [])
    assert.deepEqual(new Set(ab.opportunities.map((o) => o.id)), new Set(ba.opportunities.map((o) => o.id)))
    assert.equal(ab.opportunities.find((o) => o.id === 'a').updatedAt, T(6))
  })
})
