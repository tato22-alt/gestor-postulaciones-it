import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import planBackupImport from '../src/application/planBackupImport.js'
import Application from '../src/domain/Application.js'
import CompanySource from '../src/domain/CompanySource.js'
import JobOpportunity from '../src/domain/JobOpportunity.js'
import { BACKUP_MAX_BYTES, createBackupText, parseBackupText } from '../src/infrastructure/backupFile.js'
import { createApplication, createOpportunity } from './helpers.js'

const NOW = '2026-01-10T12:00:00.000Z'
const backupOf = (opportunities, applications, sources = []) =>
  createBackupText({ opportunities, applications, sources, now: NOW })
const tamper = (text, change) => {
  const backup = JSON.parse(text)
  change(backup)
  return JSON.stringify(backup)
}

describe('backup file', () => {
  it('round-trips opportunities and applications as domain instances', () => {
    const opportunity = createOpportunity({ status: 'saved', modality: 'remote' })
    const application = createApplication({ followUpAt: '2026-01-12', notes: 'Nota' })
    const text = backupOf([opportunity], [application])
    const envelope = JSON.parse(text)
    const result = parseBackupText(text)

    assert.equal(envelope.format, 'it-job-search-assistant.backup')
    assert.equal(envelope.schemaVersion, 3)
    assert.equal(envelope.exportedAt, NOW)
    assert.equal(result.ok, true)
    assert.ok(result.opportunities[0] instanceof JobOpportunity)
    assert.ok(result.applications[0] instanceof Application)
    assert.deepEqual({ ...result.opportunities[0] }, { ...opportunity })
    assert.deepEqual({ ...result.applications[0] }, { ...application })
  })

  it('rejects invalid JSON, unknown formats, and unsupported versions', () => {
    const valid = backupOf([], [])

    assert.equal(parseBackupText('{nope').status, 'invalid_json')
    assert.equal(parseBackupText('[]').status, 'unknown_format')
    assert.equal(parseBackupText(tamper(valid, (b) => { b.format = 'other' })).status, 'unknown_format')
    assert.equal(parseBackupText(tamper(valid, (b) => { b.schemaVersion = 4 })).status, 'unsupported_version')
  })

  it('accepts long descriptions saved before the text limits existed', () => {
    const text = backupOf([createOpportunity({ description: 'd'.repeat(12000) })], [])

    assert.equal(parseBackupText(text).ok, true)
  })

  it('accepts only integer, known schema versions', () => {
    const valid = backupOf([], [])

    for (const version of ['1', 'toString', '__proto__', 1.5]) {
      assert.equal(parseBackupText(tamper(valid, (b) => { b.schemaVersion = version })).ok, false, String(version))
    }
  })

  it('still accepts version 1 backups without sources', () => {
    const v1 = tamper(backupOf([createOpportunity()], []), (b) => {
      b.schemaVersion = 1
      delete b.sources
      delete b.deletions
    })
    const result = parseBackupText(v1)

    assert.equal(result.ok, true)
    assert.deepEqual(result.sources, [])
  })

  it('round-trips sources and rejects unsafe source URLs', () => {
    const source = new CompanySource({ id: 's1', companyName: 'Acme', careersUrl: 'https://acme.com/jobs', status: 'approved', discoveredAt: NOW })
    const text = backupOf([], [], [source])

    assert.deepEqual({ ...parseBackupText(text).sources[0] }, { ...source })
    assert.equal(parseBackupText(tamper(text, (b) => { b.sources[0].careersUrl = 'javascript:x' })).status, 'invalid_records')
  })

  it('rejects oversized text before parsing', () => {
    assert.equal(parseBackupText(' '.repeat(BACKUP_MAX_BYTES + 1)).status, 'too_large')
  })

  const maliciousCases = {
    'a __proto__ key': (b) => { b.opportunities[0] = JSON.parse(`{"__proto__":{"polluted":true},${JSON.stringify(b.opportunities[0]).slice(1)}`) },
    'a constructor key anywhere': (b) => { b.opportunities[0].salary = { constructor: 1 } },
    'a javascript: URL': (b) => { b.opportunities[0].url = 'javascript:alert(1)' },
    'duplicated opportunity ids': (b) => { b.opportunities.push({ ...b.opportunities[0] }) },
    'two applications for one opportunity': (b) => { b.applications.push({ ...b.applications[0], id: 'other' }) },
    'notes over the limit': (b) => { b.applications[0].notes = 'n'.repeat(2001) },
    'an extra envelope field': (b) => { b.extra = true },
  }

  for (const [description, change] of Object.entries(maliciousCases)) {
    it(`rejects a backup with ${description}`, () => {
      const text = tamper(backupOf([createOpportunity()], [createApplication()]), change)

      assert.equal(parseBackupText(text).status, 'invalid_records')
      assert.equal({}.polluted, undefined)
    })
  }
})

describe('planBackupImport', () => {
  const plan = (current, backup) =>
    planBackupImport({
      currentOpportunities: current.opportunities,
      currentApplications: current.applications,
      backupOpportunities: backup.opportunities,
      backupApplications: backup.applications,
    })

  it('adds new records and keeps existing ones untouched', () => {
    const existing = createOpportunity({ id: 'a', company: 'Local' })
    const fromBackup = createOpportunity({ id: 'a', company: 'Backup' })
    const added = createOpportunity({ id: 'b' })
    const result = plan(
      { opportunities: [existing], applications: [] },
      { opportunities: [fromBackup, added], applications: [] },
    )

    assert.deepEqual(result.opportunitiesToAdd, [added])
    assert.equal(result.skipped.existingOpportunities, 1)
    assert.deepEqual(result.nextOpportunities, [existing, added])
    assert.equal(result.nextOpportunities[0].company, 'Local')
  })

  it('adds an application only when its opportunity exists and has no application', () => {
    const result = plan(
      {
        opportunities: [createOpportunity({ id: 'o1' }), createOpportunity({ id: 'o2' })],
        applications: [createApplication({ id: 'existing', opportunityId: 'o1' })],
      },
      {
        opportunities: [createOpportunity({ id: 'o3' })],
        applications: [
          createApplication({ id: 'existing', opportunityId: 'o1' }),
          createApplication({ id: 'second-for-o1', opportunityId: 'o1' }),
          createApplication({ id: 'orphan', opportunityId: 'missing' }),
          createApplication({ id: 'for-o2', opportunityId: 'o2' }),
          createApplication({ id: 'for-o3', opportunityId: 'o3' }),
        ],
      },
    )

    assert.deepEqual(result.applicationsToAdd.map((a) => a.id), ['for-o2', 'for-o3'])
    assert.deepEqual(result.skipped, {
      existingSources: 0,
      existingOpportunities: 0,
      opportunitiesWithoutSource: 0,
      existingApplications: 1,
      applicationsWithoutOpportunity: 1,
      applicationsAlreadyApplied: 1,
    })
  })

  it('imports an opportunity without its source when the source is missing', () => {
    const result = plan(
      { opportunities: [], applications: [] },
      { opportunities: [createOpportunity({ id: 'o1', sourceId: 'gone' })], applications: [] },
    )

    assert.equal(result.opportunitiesToAdd[0].sourceId, null)
    assert.equal(result.skipped.opportunitiesWithoutSource, 1)
  })

  it('reports no changes when re-importing the same data', () => {
    const opportunities = [createOpportunity()]
    const applications = [createApplication()]
    const result = plan({ opportunities, applications }, { opportunities, applications })

    assert.equal(result.hasChanges, false)
    assert.deepEqual(result.nextOpportunities, opportunities)
  })
})
