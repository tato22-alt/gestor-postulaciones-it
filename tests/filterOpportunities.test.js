import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import filterOpportunities from '../src/application/filterOpportunities.js'
import { createOpportunity } from './helpers.js'

const opportunities = [
  createOpportunity({ id: 'a', company: 'Globant', title: 'Analista de Gestión', status: 'detected' }),
  createOpportunity({ id: 'b', company: 'Mercado Libre', title: 'Desarrollador React', status: 'saved' }),
  createOpportunity({ id: 'c', company: 'Accenture', title: 'Soporte funcional', status: 'archived' }),
]

function ids(result) {
  return result.map((opportunity) => opportunity.id)
}

describe('filterOpportunities', () => {
  it('returns every opportunity without criteria', () => {
    assert.deepEqual(ids(filterOpportunities(opportunities)), ['a', 'b', 'c'])
  })

  it('searches company and title case-insensitively', () => {
    assert.deepEqual(ids(filterOpportunities(opportunities, { searchQuery: 'MERCADO' })), ['b'])
    assert.deepEqual(ids(filterOpportunities(opportunities, { searchQuery: 'react' })), ['b'])
  })

  it('ignores accents in both directions', () => {
    assert.deepEqual(ids(filterOpportunities(opportunities, { searchQuery: 'gestion' })), ['a'])
    assert.deepEqual(ids(filterOpportunities(opportunities, { searchQuery: 'sóporte' })), ['c'])
  })

  it('trims the query and treats whitespace-only as empty', () => {
    assert.deepEqual(ids(filterOpportunities(opportunities, { searchQuery: '  globant ' })), ['a'])
    assert.deepEqual(ids(filterOpportunities(opportunities, { searchQuery: '   ' })), ['a', 'b', 'c'])
  })

  it('treats regular-expression characters literally', () => {
    assert.deepEqual(ids(filterOpportunities(opportunities, { searchQuery: '.*' })), [])
    assert.doesNotThrow(() => filterOpportunities(opportunities, { searchQuery: '([' }))
  })

  it('filters by status and combines with search', () => {
    assert.deepEqual(ids(filterOpportunities(opportunities, { status: 'saved' })), ['b'])
    assert.deepEqual(
      ids(filterOpportunities(opportunities, { searchQuery: 'globant', status: 'saved' })),
      [],
    )
  })

  it('returns no results for an unknown status', () => {
    assert.deepEqual(filterOpportunities(opportunities, { status: 'applied' }), [])
  })

  it('does not mutate the source collection', () => {
    const snapshot = [...opportunities]
    const result = filterOpportunities(opportunities, { status: 'saved' })

    assert.notEqual(result, opportunities)
    assert.deepEqual(opportunities, snapshot)
  })

  it('returns an empty array for a non-array input', () => {
    assert.deepEqual(filterOpportunities(null), [])
    assert.deepEqual(filterOpportunities({}), [])
  })
})
