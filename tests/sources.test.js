import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createSource, deleteSource, updateSource } from '../src/application/manageSources.js'
import CompanySource from '../src/domain/CompanySource.js'
import LocalStorageSourceRepository, {
  SOURCE_STORAGE_KEY,
} from '../src/infrastructure/LocalStorageSourceRepository.js'
import { MemoryStorage, createOpportunity } from './helpers.js'

const NOW = '2026-01-10T12:00:00.000Z'
const valid = (overrides = {}) => ({ companyName: ' Acme ', careersUrl: ' https://Acme.com/careers ', ...overrides })

describe('manageSources', () => {
  it('creates an approved source with normalized input', () => {
    const result = createSource([], { changes: valid(), now: NOW })

    assert.equal(result.ok, true)
    assert.ok(result.source instanceof CompanySource)
    assert.equal(result.source.companyName, 'Acme')
    assert.equal(result.source.careersUrl, 'https://acme.com/careers')
    assert.equal(result.source.status, 'approved')
    assert.equal(result.source.approvedAt, NOW)
    assert.equal(result.source.createdAt, NOW)
  })

  it('rejects missing, too long, or unsafe input', () => {
    assert.deepEqual(createSource([], { changes: valid({ companyName: ' ', careersUrl: 'javascript:alert(1)' }) }).errors, {
      companyName: 'required',
      careersUrl: 'invalid_url',
    })
    assert.equal(createSource([], { changes: valid({ companyName: 'a'.repeat(201) }) }).errors.companyName, 'too_long')
  })

  it('updates a source with optimistic concurrency', () => {
    const { source } = createSource([], { changes: valid(), now: NOW })
    const result = updateSource([source], {
      id: source.id,
      expectedUpdatedAt: NOW,
      changes: valid({ companyName: 'Acme SA' }),
      now: '2026-01-11T12:00:00.000Z',
    })

    assert.equal(result.source.companyName, 'Acme SA')
    assert.equal(result.source.createdAt, NOW)
    assert.equal(result.source.updatedAt, '2026-01-11T12:00:00.000Z')
    assert.equal(updateSource([source], { id: source.id, expectedUpdatedAt: 'stale', changes: valid() }).status, 'conflict')
  })

  it('blocks deleting a source that opportunities reference', () => {
    const { source } = createSource([], { changes: valid(), now: NOW })
    const request = { id: source.id, expectedUpdatedAt: NOW }

    assert.equal(deleteSource([source], [createOpportunity({ sourceId: source.id })], request).status, 'has_opportunities')
    assert.deepEqual(deleteSource([source], [createOpportunity()], request).sources, [])
    assert.equal(deleteSource([source], [], { id: source.id, expectedUpdatedAt: 'stale' }).status, 'conflict')
  })
})

describe('LocalStorageSourceRepository', () => {
  it('round-trips sources as domain instances', () => {
    const storage = new MemoryStorage()
    const { source } = createSource([], { changes: valid(), now: NOW })

    assert.equal(new LocalStorageSourceRepository(storage).saveAll([source]).ok, true)

    const loaded = new LocalStorageSourceRepository(storage).loadAll()

    assert.ok(loaded.sources[0] instanceof CompanySource)
    assert.deepEqual({ ...loaded.sources[0] }, { ...source })
  })

  it('preserves corrupted data and blocks saving', () => {
    const storage = new MemoryStorage({ [SOURCE_STORAGE_KEY]: '{bad' })
    const repository = new LocalStorageSourceRepository(storage)

    assert.equal(repository.loadAll().status, 'corrupted')
    assert.equal(repository.saveAll([]).status, 'blocked')
    assert.equal(repository.readRawValue(), '{bad')
  })

  it('rejects unsafe URLs and unknown statuses', () => {
    const { source } = createSource([], { changes: valid(), now: NOW })

    for (const override of [{ careersUrl: 'javascript:alert(1)' }, { status: 'monitoring' }]) {
      const record = { ...source, ...override }
      const storage = new MemoryStorage({ [SOURCE_STORAGE_KEY]: JSON.stringify({ schemaVersion: 1, sources: [record] }) })

      assert.equal(new LocalStorageSourceRepository(storage).loadAll().status, 'corrupted')
    }
  })
})
