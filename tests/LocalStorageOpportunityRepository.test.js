import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import JobOpportunity from '../src/domain/JobOpportunity.js'
import LocalStorageOpportunityRepository, {
  OPPORTUNITY_STORAGE_KEY,
} from '../src/infrastructure/LocalStorageOpportunityRepository.js'
import { MemoryStorage, createOpportunity } from './helpers.js'

function createStoredEnvelope(opportunities, schemaVersion = 1) {
  const storage = new MemoryStorage()
  new LocalStorageOpportunityRepository(storage).saveAll(opportunities)
  const envelope = JSON.parse(storage.getItem(OPPORTUNITY_STORAGE_KEY))

  return { ...envelope, schemaVersion }
}

function storageWith(value) {
  return new MemoryStorage({ [OPPORTUNITY_STORAGE_KEY]: value })
}

describe('LocalStorageOpportunityRepository loadAll', () => {
  it('returns an empty valid collection when the key is missing', () => {
    assert.deepEqual(new LocalStorageOpportunityRepository(new MemoryStorage()).loadAll(), {
      ok: true,
      status: 'empty',
      opportunities: [],
    })
  })

  it('round-trips opportunities as real domain instances', () => {
    const storage = new MemoryStorage()
    const original = createOpportunity({
      status: 'saved',
      modality: 'hybrid',
      publishedAt: '2026-01-01',
      salary: { amount: 1000, currency: 'ARS', period: 'monthly' },
      requiredSkills: ['SQL'],
    })

    assert.deepEqual(new LocalStorageOpportunityRepository(storage).saveAll([original]), {
      ok: true,
      status: 'saved',
    })

    const result = new LocalStorageOpportunityRepository(storage).loadAll()

    assert.equal(result.ok, true)
    assert.equal(result.status, 'loaded')
    assert.ok(result.opportunities[0] instanceof JobOpportunity)
    assert.deepEqual({ ...result.opportunities[0] }, { ...original })
  })

  const corruptedCases = {
    'malformed JSON': '{not json',
    'a JSON array': '[]',
    'a JSON string': '"text"',
    'a missing schema version': JSON.stringify({ opportunities: [] }),
    'a missing collection': JSON.stringify({ schemaVersion: 1 }),
    'a non-array collection': JSON.stringify({ schemaVersion: 1, opportunities: {} }),
  }

  for (const [description, rawValue] of Object.entries(corruptedCases)) {
    it(`blocks persistence and preserves storage for ${description}`, () => {
      const storage = storageWith(rawValue)
      const repository = new LocalStorageOpportunityRepository(storage)

      assert.deepEqual(repository.loadAll(), {
        ok: false,
        status: 'corrupted',
        opportunities: [],
      })
      assert.equal(repository.saveAll([createOpportunity()]).status, 'blocked')
      assert.equal(storage.getItem(OPPORTUNITY_STORAGE_KEY), rawValue)
    })
  }

  it('reports an unsupported schema version', () => {
    const rawValue = JSON.stringify(createStoredEnvelope([createOpportunity()], 2))

    assert.equal(
      new LocalStorageOpportunityRepository(storageWith(rawValue)).loadAll().status,
      'unsupported_version',
    )
  })

  const invalidRecordCases = {
    'a javascript: URL': { url: 'javascript:alert(1)' },
    'a data: URL': { url: 'data:text/html,hi' },
    'an unknown status': { status: 'applied' },
    'an unknown modality': { modality: 'Remota' },
    'an empty company': { company: '   ' },
    'an invalid timestamp': { updatedAt: '2026-01-05' },
    'an impossible publication date': { publishedAt: '2026-02-30' },
    'a non-string skill': { requiredSkills: [1] },
    'an unknown salary field': { salary: { amount: 1, bonus: 2 } },
    'an extra field': { isAdmin: true },
  }

  for (const [description, override] of Object.entries(invalidRecordCases)) {
    it(`rejects the whole collection when a record has ${description}`, () => {
      const envelope = createStoredEnvelope([createOpportunity({ id: 'a' }), createOpportunity({ id: 'b' })])

      envelope.opportunities[1] = { ...envelope.opportunities[1], ...override }

      const rawValue = JSON.stringify(envelope)
      const storage = storageWith(rawValue)

      assert.equal(new LocalStorageOpportunityRepository(storage).loadAll().status, 'corrupted')
      assert.equal(storage.getItem(OPPORTUNITY_STORAGE_KEY), rawValue)
    })
  }

  it('rejects a record with a missing field', () => {
    const envelope = createStoredEnvelope([createOpportunity()])

    delete envelope.opportunities[0].description

    assert.equal(
      new LocalStorageOpportunityRepository(storageWith(JSON.stringify(envelope))).loadAll().status,
      'corrupted',
    )
  })

  it('reports unavailable storage and read failures', () => {
    assert.equal(new LocalStorageOpportunityRepository(null).loadAll().status, 'unavailable')

    const throwingStorage = {
      getItem() {
        throw new Error('SecurityError')
      },
    }

    assert.equal(
      new LocalStorageOpportunityRepository(throwingStorage).loadAll().status,
      'read_failure',
    )
  })

  it('unblocks persistence after a later valid load', () => {
    const storage = storageWith('{broken')
    const repository = new LocalStorageOpportunityRepository(storage)

    repository.loadAll()
    storage.setItem(OPPORTUNITY_STORAGE_KEY, JSON.stringify(createStoredEnvelope([])))

    assert.equal(repository.loadAll().ok, true)
    assert.equal(repository.saveAll([createOpportunity()]).ok, true)
  })
})

describe('LocalStorageOpportunityRepository saveAll', () => {
  it('writes a versioned envelope under the namespaced key', () => {
    const storage = new MemoryStorage()

    new LocalStorageOpportunityRepository(storage).saveAll([createOpportunity()])

    const envelope = JSON.parse(storage.getItem(OPPORTUNITY_STORAGE_KEY))

    assert.equal(envelope.schemaVersion, 1)
    assert.equal(envelope.opportunities.length, 1)
  })

  it('reports quota or write failures without throwing', () => {
    const fullStorage = {
      getItem: () => null,
      setItem() {
        throw new Error('QuotaExceededError')
      },
    }

    assert.deepEqual(
      new LocalStorageOpportunityRepository(fullStorage).saveAll([createOpportunity()]),
      { ok: false, status: 'write_failure' },
    )
  })

  it('refuses to persist invalid data or an unsafe URL', () => {
    const storage = new MemoryStorage()
    const repository = new LocalStorageOpportunityRepository(storage)

    assert.equal(repository.saveAll('text').status, 'invalid_data')
    assert.equal(repository.saveAll([null]).status, 'invalid_data')
    assert.equal(
      repository.saveAll([createOpportunity({ url: 'javascript:alert(1)' })]).status,
      'invalid_data',
    )
    assert.equal(storage.getItem(OPPORTUNITY_STORAGE_KEY), null)
  })

  it('reports unavailable storage', () => {
    assert.equal(
      new LocalStorageOpportunityRepository(null).saveAll([]).status,
      'unavailable',
    )
  })
})
