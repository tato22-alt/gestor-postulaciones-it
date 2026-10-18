import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import Application from '../src/domain/Application.js'
import LocalStorageApplicationRepository, {
  APPLICATION_STORAGE_KEY,
} from '../src/infrastructure/LocalStorageApplicationRepository.js'
import { OPPORTUNITY_STORAGE_KEY } from '../src/infrastructure/LocalStorageOpportunityRepository.js'
import { MemoryStorage, createApplication } from './helpers.js'

function createStoredEnvelope(applications) {
  const storage = new MemoryStorage()
  new LocalStorageApplicationRepository(storage).saveAll(applications)
  return JSON.parse(storage.getItem(APPLICATION_STORAGE_KEY))
}

function storageWith(value) {
  return new MemoryStorage({ [APPLICATION_STORAGE_KEY]: value })
}

describe('LocalStorageApplicationRepository', () => {
  it('uses its own key, separate from opportunities', () => {
    assert.notEqual(APPLICATION_STORAGE_KEY, OPPORTUNITY_STORAGE_KEY)
  })

  it('returns an empty valid collection when the key is missing', () => {
    assert.deepEqual(new LocalStorageApplicationRepository(new MemoryStorage()).loadAll(), {
      ok: true,
      status: 'empty',
      applications: [],
    })
  })

  it('round-trips applications as real domain instances', () => {
    const storage = new MemoryStorage()
    const original = createApplication({ status: 'interview', notes: 'Notas' })

    assert.equal(new LocalStorageApplicationRepository(storage).saveAll([original]).ok, true)

    const result = new LocalStorageApplicationRepository(storage).loadAll()

    assert.equal(result.status, 'loaded')
    assert.ok(result.applications[0] instanceof Application)
    assert.deepEqual({ ...result.applications[0] }, { ...original })
    assert.equal(JSON.parse(storage.getItem(APPLICATION_STORAGE_KEY)).schemaVersion, 1)
  })

  const corruptedCases = {
    'malformed JSON': '{not json',
    'a JSON array': '[]',
    'a missing schema version': JSON.stringify({ applications: [] }),
    'a non-array collection': JSON.stringify({ schemaVersion: 1, applications: {} }),
  }

  for (const [description, rawValue] of Object.entries(corruptedCases)) {
    it(`blocks persistence and preserves storage for ${description}`, () => {
      const storage = storageWith(rawValue)
      const repository = new LocalStorageApplicationRepository(storage)

      assert.equal(repository.loadAll().status, 'corrupted')
      assert.equal(repository.saveAll([createApplication()]).status, 'blocked')
      assert.equal(storage.getItem(APPLICATION_STORAGE_KEY), rawValue)
    })
  }

  it('reports an unsupported schema version', () => {
    const rawValue = JSON.stringify({ schemaVersion: 2, applications: [] })

    assert.equal(
      new LocalStorageApplicationRepository(storageWith(rawValue)).loadAll().status,
      'unsupported_version',
    )
  })

  const invalidRecordCases = {
    'an unknown status': { status: 'saved' },
    'an empty opportunity reference': { opportunityId: '' },
    'an invalid applied date': { appliedAt: '2026-01-05' },
    'a non-string note': { notes: 5 },
    'an invalid follow-up date': { followUpAt: 'tomorrow' },
    'an extra field': { salaryExpectation: 1000 },
  }

  for (const [description, override] of Object.entries(invalidRecordCases)) {
    it(`rejects the collection when a record has ${description}`, () => {
      const envelope = createStoredEnvelope([createApplication()])

      envelope.applications[0] = { ...envelope.applications[0], ...override }

      const rawValue = JSON.stringify(envelope)
      const storage = storageWith(rawValue)

      assert.equal(new LocalStorageApplicationRepository(storage).loadAll().status, 'corrupted')
      assert.equal(storage.getItem(APPLICATION_STORAGE_KEY), rawValue)
    })
  }

  it('rejects two applications for the same opportunity or with the same id', () => {
    const first = createStoredEnvelope([createApplication()]).applications[0]
    const sameOpportunity = { ...first, id: 'application-2' }
    const sameId = { ...first, opportunityId: 'opportunity-2' }

    for (const duplicate of [sameOpportunity, sameId]) {
      const rawValue = JSON.stringify({ schemaVersion: 1, applications: [first, duplicate] })

      assert.equal(
        new LocalStorageApplicationRepository(storageWith(rawValue)).loadAll().status,
        'corrupted',
      )
    }
  })

  it('refuses to save invalid or duplicated applications', () => {
    const storage = new MemoryStorage()
    const repository = new LocalStorageApplicationRepository(storage)

    assert.equal(repository.saveAll('text').status, 'invalid_data')
    assert.equal(repository.saveAll([null]).status, 'invalid_data')
    assert.equal(
      repository.saveAll([createApplication(), createApplication({ id: 'application-2' })]).status,
      'invalid_data',
    )
    assert.equal(storage.getItem(APPLICATION_STORAGE_KEY), null)
  })

  it('reports unavailable storage, read failures, and write failures', () => {
    assert.equal(new LocalStorageApplicationRepository(null).loadAll().status, 'unavailable')
    assert.equal(
      new LocalStorageApplicationRepository({
        getItem() {
          throw new Error('SecurityError')
        },
      }).loadAll().status,
      'read_failure',
    )
    assert.equal(
      new LocalStorageApplicationRepository({
        getItem: () => null,
        setItem() {
          throw new Error('QuotaExceededError')
        },
      }).saveAll([createApplication()]).status,
      'write_failure',
    )
  })
})
