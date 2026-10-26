import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { addTargetRole, removeTargetRole, setPreferenceOption } from '../src/application/managePreferences.js'
import mergeSnapshots from '../src/application/mergeSnapshots.js'
import planBackupImport from '../src/application/planBackupImport.js'
import { validateTargetRoleInput } from '../src/application/profileInput.js'
import JobSearchPreferences from '../src/domain/JobSearchPreferences.js'
import {
  TARGET_ROLES_MAX_COUNT,
  isValidPreferenceOptions,
  isValidTargetRoleList,
} from '../src/domain/jobSearchPreferencesPolicy.js'
import { createBackupText, parseBackupText } from '../src/infrastructure/backupFile.js'
import LocalStoragePreferencesRepository, {
  PREFERENCES_STORAGE_KEY,
} from '../src/infrastructure/LocalStoragePreferencesRepository.js'
import { MemoryStorage } from './helpers.js'

const NOW = '2026-01-10T12:00:00.000Z'
const LATER = '2026-01-11T12:00:00.000Z'
const preferencesWith = (overrides = {}) =>
  new JobSearchPreferences({ id: 'preferences-1', createdAt: NOW, ...overrides })
const empty = () => ({ opportunities: [], applications: [], sources: [], deletions: [], profile: null, preferences: null })
const storedRecord = (overrides = {}) => ({
  id: 'p',
  targetRoles: ['Trainee'],
  preferredModalities: ['hybrid', 'remote'],
  acceptedEmploymentTypes: ['internship'],
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
})

describe('jobSearchPreferencesPolicy', () => {
  it('accepts only known options, without repeats, in canonical order', () => {
    assert.equal(isValidPreferenceOptions('preferredModalities', []), true)
    assert.equal(isValidPreferenceOptions('preferredModalities', ['on_site', 'remote']), true)
    assert.equal(isValidPreferenceOptions('preferredModalities', ['remote', 'on_site']), false)
    assert.equal(isValidPreferenceOptions('preferredModalities', ['remote', 'remote']), false)
    assert.equal(isValidPreferenceOptions('preferredModalities', ['full_time']), false)
    assert.equal(isValidPreferenceOptions('acceptedEmploymentTypes', ['full_time', 'internship']), true)
    assert.equal(isValidPreferenceOptions('salaryReference', []), false)
    assert.equal(isValidPreferenceOptions('preferredModalities', 'remote'), false)
  })

  it('validates target roles like skills, with their own limits', () => {
    assert.equal(isValidTargetRoleList(['Desarrollador trainee', 'Analista funcional']), true)
    assert.equal(isValidTargetRoleList(['Analista', 'analista']), false)
    assert.equal(isValidTargetRoleList(['r'.repeat(81)]), false)
    assert.equal(validateTargetRoleInput('r'.repeat(81)), 'too_long')
    assert.equal(validateTargetRoleInput(' trainee ', ['Trainee']), 'duplicate')
    assert.equal(
      validateTargetRoleInput('nuevo', Array.from({ length: TARGET_ROLES_MAX_COUNT }, (_, i) => `r${i}`)),
      'too_many',
    )
  })
})

describe('managePreferences', () => {
  it('creates the preferences on the first role and appends later ones', () => {
    const created = addTargetRole(null, { role: '  Desarrollador   trainee ', now: NOW })

    assert.equal(created.status, 'created')
    assert.ok(created.preferences instanceof JobSearchPreferences)
    assert.deepEqual(created.preferences.targetRoles, ['Desarrollador trainee'])
    assert.equal(created.preferences.createdAt, NOW)

    const updated = addTargetRole(created.preferences, { role: 'QA', now: LATER })
    assert.deepEqual(updated.preferences.targetRoles, ['Desarrollador trainee', 'QA'])
    assert.deepEqual(created.preferences.targetRoles, ['Desarrollador trainee'])
    assert.equal(updated.preferences.updatedAt, LATER)
    assert.equal(updated.preferences.id, created.preferences.id)
  })

  it('rejects invalid roles and removes a role by its comparison key', () => {
    const current = preferencesWith({ targetRoles: ['Analista funcional', 'QA'] })

    assert.equal(addTargetRole(current, { role: 'qa' }).error, 'duplicate')
    assert.deepEqual(removeTargetRole(current, { role: 'analista FUNCIONAL', now: LATER }).preferences.targetRoles, ['QA'])
    assert.equal(removeTargetRole(current, { role: 'Otro' }).status, 'not_found')
    assert.equal(removeTargetRole(null, { role: 'QA' }).status, 'not_found')
  })

  it('checks and unchecks options, keeping the canonical order', () => {
    const first = setPreferenceOption(null, { field: 'preferredModalities', value: 'remote', isSelected: true, now: NOW })
    const second = setPreferenceOption(first.preferences, {
      field: 'preferredModalities',
      value: 'on_site',
      isSelected: true,
      now: LATER,
    })

    assert.deepEqual(first.preferences.preferredModalities, ['remote'])
    assert.deepEqual(second.preferences.preferredModalities, ['on_site', 'remote'])
    assert.deepEqual(
      setPreferenceOption(second.preferences, { field: 'preferredModalities', value: 'remote', isSelected: false }).preferences
        .preferredModalities,
      ['on_site'],
    )
    assert.equal(
      setPreferenceOption(second.preferences, { field: 'preferredModalities', value: 'remote', isSelected: true }).status,
      'unchanged',
    )
  })

  it('rejects unknown fields and values', () => {
    assert.equal(setPreferenceOption(null, { field: 'salaryReference', value: 'x', isSelected: true }).status, 'invalid_input')
    assert.equal(setPreferenceOption(null, { field: 'preferredModalities', value: 'full_time', isSelected: true }).status, 'invalid_input')
    assert.equal(setPreferenceOption(null, { field: '__proto__', value: 'remote', isSelected: true }).status, 'invalid_input')
  })
})

describe('LocalStoragePreferencesRepository', () => {
  it('round-trips only the approved fields', () => {
    const storage = new MemoryStorage()
    const repository = new LocalStoragePreferencesRepository(storage)

    assert.deepEqual(repository.load(), { ok: true, status: 'empty', preferences: null })

    const preferences = preferencesWith({
      targetRoles: ['Trainee'],
      preferredModalities: ['hybrid', 'remote'],
      acceptedEmploymentTypes: ['internship'],
      staleAfterDays: 30,
    })
    assert.equal(repository.save(preferences).ok, true)
    assert.deepEqual(JSON.parse(storage.getItem(PREFERENCES_STORAGE_KEY)), {
      schemaVersion: 1,
      preferences: storedRecord({ id: 'preferences-1' }),
    })

    const loaded = new LocalStoragePreferencesRepository(storage).load()
    assert.ok(loaded.preferences instanceof JobSearchPreferences)
    assert.deepEqual(loaded.preferences.preferredModalities, ['hybrid', 'remote'])
    assert.equal(loaded.preferences.staleAfterDays, null)
  })

  const corruptedValues = {
    'malformed JSON': '{nope',
    'an unknown modality': JSON.stringify({ schemaVersion: 1, preferences: storedRecord({ preferredModalities: ['moon'] }) }),
    'an unsorted option list': JSON.stringify({ schemaVersion: 1, preferences: storedRecord({ preferredModalities: ['remote', 'hybrid'] }) }),
    'a duplicated role': JSON.stringify({ schemaVersion: 1, preferences: storedRecord({ targetRoles: ['QA', 'qa'] }) }),
    'an extra field': JSON.stringify({ schemaVersion: 1, preferences: { ...storedRecord(), salaryReference: 1 } }),
  }

  for (const [description, rawValue] of Object.entries(corruptedValues)) {
    it(`preserves and blocks ${description}`, () => {
      const storage = new MemoryStorage({ [PREFERENCES_STORAGE_KEY]: rawValue })
      const repository = new LocalStoragePreferencesRepository(storage)

      assert.equal(repository.load().ok, false)
      assert.equal(repository.save(preferencesWith()).status, 'blocked')
      assert.equal(storage.getItem(PREFERENCES_STORAGE_KEY), rawValue)
      assert.equal(repository.readRawValue(), rawValue)
    })
  }
})

describe('preferences in backups, imports, and synchronization', () => {
  it('round-trips preferences in a version 5 backup and still reads version 4', () => {
    const preferences = preferencesWith({ targetRoles: ['QA'], acceptedEmploymentTypes: ['full_time'] })
    const text = createBackupText({ opportunities: [], applications: [], sources: [], preferences, now: NOW })
    const parsed = parseBackupText(text)

    assert.equal(JSON.parse(text).schemaVersion, 5)
    assert.ok(parsed.preferences instanceof JobSearchPreferences)
    assert.deepEqual(parsed.preferences.targetRoles, ['QA'])

    const v4 = JSON.parse(text)
    v4.schemaVersion = 4
    delete v4.preferences
    assert.equal(parseBackupText(JSON.stringify(v4)).preferences, null)

    const unsafe = JSON.parse(text)
    unsafe.preferences.preferredModalities = ['javascript:alert(1)']
    assert.equal(parseBackupText(JSON.stringify(unsafe)).status, 'invalid_records')
  })

  it('imports preferences only when this browser has none', () => {
    const local = preferencesWith({ targetRoles: ['Local'] })
    const fromBackup = preferencesWith({ id: 'other', targetRoles: ['Backup'] })
    const plan = (currentPreferences) =>
      planBackupImport({
        currentOpportunities: [],
        currentApplications: [],
        backupOpportunities: [],
        backupApplications: [],
        currentPreferences,
        backupPreferences: fromBackup,
      })

    assert.equal(plan(null).nextPreferences, fromBackup)
    assert.equal(plan(null).hasChanges, true)
    assert.equal(plan(local).nextPreferences, local)
    assert.equal(plan(local).skipped.existingPreferences, true)
    assert.equal(plan(local).hasChanges, false)
  })

  it('merges preferences as a single record where the newest edit wins', () => {
    const older = preferencesWith({ targetRoles: ['QA'] })
    const newer = preferencesWith({ targetRoles: ['QA', 'Trainee'], updatedAt: LATER })

    assert.deepEqual(mergeSnapshots({ ...empty(), preferences: older }, { ...empty(), preferences: newer }).preferences.targetRoles, ['QA', 'Trainee'])
    assert.deepEqual(mergeSnapshots({ ...empty(), preferences: newer }, { ...empty(), preferences: older }).preferences.targetRoles, ['QA', 'Trainee'])

    const onlyRemote = mergeSnapshots(empty(), { ...empty(), preferences: older })
    assert.equal(onlyRemote.changedLocal, true)
    assert.equal(mergeSnapshots({ ...empty(), preferences: older }, empty()).changedRemote, true)
  })
})
