import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { addProfileSkill, removeProfileSkill } from '../src/application/manageProfile.js'
import mergeSnapshots from '../src/application/mergeSnapshots.js'
import { validateSkillInput } from '../src/application/profileInput.js'
import CandidateProfile from '../src/domain/CandidateProfile.js'
import {
  SKILLS_MAX_COUNT,
  getSkillKey,
  isValidSkillList,
  normalizeSkill,
} from '../src/domain/candidateSkillsPolicy.js'
import LocalStorageProfileRepository, {
  PROFILE_STORAGE_KEY,
} from '../src/infrastructure/LocalStorageProfileRepository.js'
import { MemoryStorage } from './helpers.js'

const NOW = '2026-01-10T12:00:00.000Z'
const LATER = '2026-01-11T12:00:00.000Z'
const profileWith = (skills, overrides = {}) =>
  new CandidateProfile({ id: 'profile-1', skills, createdAt: NOW, ...overrides })
const empty = () => ({ opportunities: [], applications: [], sources: [], deletions: [], profile: null })

describe('candidateSkillsPolicy', () => {
  it('normalizes spacing and compares without case or accents', () => {
    assert.equal(normalizeSkill('  Gestión   de  proyectos '), 'Gestión de proyectos')
    assert.equal(getSkillKey('Gestión de Proyectos'), getSkillKey('gestion  de proyectos'))
    assert.notEqual(getSkillKey('C'), getSkillKey('C#'))
  })

  it('accepts only normalized, unique, bounded skill lists', () => {
    assert.equal(isValidSkillList([]), true)
    assert.equal(isValidSkillList(['React', 'SQL Server']), true)
    assert.equal(isValidSkillList(['React', 'react']), false)
    assert.equal(isValidSkillList([' React']), false)
    assert.equal(isValidSkillList(['']), false)
    assert.equal(isValidSkillList(['s'.repeat(61)]), false)
    assert.equal(isValidSkillList([42]), false)
    assert.equal(isValidSkillList('React'), false)
    assert.equal(isValidSkillList(Array.from({ length: SKILLS_MAX_COUNT + 1 }, (_, i) => `s${i}`)), false)
  })
})

describe('validateSkillInput', () => {
  it('returns an error code for each invalid case', () => {
    assert.equal(validateSkillInput('   '), 'required')
    assert.equal(validateSkillInput(undefined), 'required')
    assert.equal(validateSkillInput('s'.repeat(61)), 'too_long')
    assert.equal(validateSkillInput(' REACT ', ['React']), 'duplicate')
    assert.equal(
      validateSkillInput('nueva', Array.from({ length: SKILLS_MAX_COUNT }, (_, i) => `s${i}`)),
      'too_many',
    )
    assert.equal(validateSkillInput('Git', ['React']), null)
  })

  it('treats text that looks like markup as plain text', () => {
    assert.equal(validateSkillInput('<img src=x onerror=alert(1)>'), null)
  })
})

describe('manageProfile', () => {
  it('creates the profile with the first skill', () => {
    const result = addProfileSkill(null, { skill: '  React ', now: NOW })

    assert.equal(result.status, 'created')
    assert.ok(result.profile instanceof CandidateProfile)
    assert.deepEqual(result.profile.skills, ['React'])
    assert.equal(result.profile.createdAt, NOW)
    assert.equal(result.profile.updatedAt, NOW)
  })

  it('appends a skill without mutating the current profile', () => {
    const current = profileWith(['React'])
    const result = addProfileSkill(current, { skill: 'SQL Server', now: LATER })

    assert.deepEqual(result.profile.skills, ['React', 'SQL Server'])
    assert.deepEqual(current.skills, ['React'])
    assert.equal(result.profile.id, 'profile-1')
    assert.equal(result.profile.createdAt, NOW)
    assert.equal(result.profile.updatedAt, LATER)
  })

  it('always advances updatedAt, even when the clock is behind', () => {
    const current = profileWith(['React'], { updatedAt: LATER })

    assert.ok(addProfileSkill(current, { skill: 'Git', now: NOW }).profile.updatedAt > LATER)
  })

  it('rejects invalid or duplicated skills', () => {
    const current = profileWith(['React'])

    assert.deepEqual(addProfileSkill(current, { skill: 'react' }), {
      ok: false,
      status: 'invalid_input',
      error: 'duplicate',
    })
    assert.equal(addProfileSkill(null, { skill: '' }).error, 'required')
  })

  it('removes a skill by its comparison key', () => {
    const current = profileWith(['React', 'Gestión'])
    const result = removeProfileSkill(current, { skill: 'gestion', now: LATER })

    assert.deepEqual(result.profile.skills, ['React'])
    assert.deepEqual(current.skills, ['React', 'Gestión'])
    assert.equal(removeProfileSkill(current, { skill: 'Python' }).status, 'not_found')
    assert.equal(removeProfileSkill(null, { skill: 'React' }).status, 'not_found')
  })
})

describe('LocalStorageProfileRepository', () => {
  it('starts with no profile and round-trips only the approved fields', () => {
    const storage = new MemoryStorage()
    const repository = new LocalStorageProfileRepository(storage)

    assert.deepEqual(repository.load(), { ok: true, status: 'empty', profile: null })

    const profile = profileWith(['React'], { name: 'No se guarda' })
    assert.equal(repository.save(profile).ok, true)
    assert.deepEqual(JSON.parse(storage.getItem(PROFILE_STORAGE_KEY)), {
      schemaVersion: 2,
      profile: { id: 'profile-1', skills: ['React'], cvText: '', createdAt: NOW, updatedAt: NOW },
    })

    const loaded = new LocalStorageProfileRepository(storage).load()
    assert.equal(loaded.status, 'loaded')
    assert.ok(loaded.profile instanceof CandidateProfile)
    assert.deepEqual(loaded.profile.skills, ['React'])
    assert.equal(loaded.profile.name, '')
  })

  const corruptedValues = {
    'malformed JSON': '{nope',
    'a non-object envelope': '[]',
    'a missing version': JSON.stringify({ profile: null }),
    'an extra envelope field': JSON.stringify({ schemaVersion: 1, profile: null, extra: 1 }),
    'a duplicated skill': JSON.stringify({
      schemaVersion: 1,
      profile: { id: 'p', skills: ['Git', 'git'], createdAt: NOW, updatedAt: NOW },
    }),
    'an invalid timestamp': JSON.stringify({
      schemaVersion: 1,
      profile: { id: 'p', skills: [], createdAt: 'ayer', updatedAt: NOW },
    }),
  }

  for (const [description, rawValue] of Object.entries(corruptedValues)) {
    it(`preserves and blocks ${description}`, () => {
      const storage = new MemoryStorage({ [PROFILE_STORAGE_KEY]: rawValue })
      const repository = new LocalStorageProfileRepository(storage)

      assert.equal(repository.load().ok, false)
      assert.equal(repository.save(profileWith(['React'])).status, 'blocked')
      assert.equal(storage.getItem(PROFILE_STORAGE_KEY), rawValue)
      assert.equal(repository.readRawValue(), rawValue)
    })
  }

  it('reports an unsupported version and storage failures', () => {
    const unsupported = new LocalStorageProfileRepository(
      new MemoryStorage({ [PROFILE_STORAGE_KEY]: JSON.stringify({ schemaVersion: 3, profile: null }) }),
    )
    assert.equal(unsupported.load().status, 'unsupported_version')

    const failing = {
      getItem() {
        throw new Error('denied')
      },
      setItem() {
        throw new Error('quota')
      },
    }
    assert.equal(new LocalStorageProfileRepository(failing).load().status, 'read_failure')
    assert.equal(new LocalStorageProfileRepository(null).load().status, 'unavailable')

    const writeFailing = new LocalStorageProfileRepository({ getItem: () => null, setItem: failing.setItem })
    writeFailing.load()
    assert.equal(writeFailing.save(profileWith(['React'])).status, 'write_failure')
  })
})

describe('mergeSnapshots with a profile', () => {
  it('keeps the profile that exists on only one side', () => {
    const profile = profileWith(['React'])
    const result = mergeSnapshots({ ...empty(), profile }, empty())

    assert.equal(result.profile, profile)
    assert.equal(result.changedLocal, false)
    assert.equal(result.changedRemote, true)
    assert.equal(mergeSnapshots(empty(), { ...empty(), profile }).changedLocal, true)
  })

  it('keeps the most recent edit and picks the same copy on a tie', () => {
    const older = profileWith(['React'])
    const newer = profileWith(['React', 'Git'], { updatedAt: LATER })

    assert.deepEqual(mergeSnapshots({ ...empty(), profile: older }, { ...empty(), profile: newer }).profile.skills, ['React', 'Git'])
    assert.deepEqual(mergeSnapshots({ ...empty(), profile: newer }, { ...empty(), profile: older }).profile.skills, ['React', 'Git'])

    const alfa = profileWith(['Alfa'])
    const beta = profileWith(['Beta'])
    assert.deepEqual(
      mergeSnapshots({ ...empty(), profile: alfa }, { ...empty(), profile: beta }).profile.skills,
      mergeSnapshots({ ...empty(), profile: beta }, { ...empty(), profile: alfa }).profile.skills,
    )
  })

  it('treats snapshots without a profile field as having no profile', () => {
    const withoutField = { opportunities: [], applications: [], sources: [], deletions: [] }
    const result = mergeSnapshots(withoutField, withoutField)

    assert.equal(result.profile, null)
    assert.equal(result.changedLocal, false)
    assert.equal(result.changedRemote, false)
  })
})

describe('profile CV text', () => {
  it('still reads version 1 profiles without a CV', () => {
    const storage = new MemoryStorage({
      [PROFILE_STORAGE_KEY]: JSON.stringify({
        schemaVersion: 1,
        profile: { id: 'p', skills: ['Git'], createdAt: NOW, updatedAt: NOW },
      }),
    })
    const loaded = new LocalStorageProfileRepository(storage).load()

    assert.equal(loaded.ok, true)
    assert.equal(loaded.profile.cvText, '')
  })

  it('round-trips the CV text and rejects a version 1 record with a CV', () => {
    const storage = new MemoryStorage()
    const repository = new LocalStorageProfileRepository(storage)

    assert.equal(repository.save(profileWith(['Git'], { cvText: 'Soporte IT\n\nJava y SQL' })).ok, true)
    assert.equal(new LocalStorageProfileRepository(storage).load().profile.cvText, 'Soporte IT\n\nJava y SQL')

    const invalid = new MemoryStorage({
      [PROFILE_STORAGE_KEY]: JSON.stringify({
        schemaVersion: 1,
        profile: { id: 'p', skills: [], cvText: 'x', createdAt: NOW, updatedAt: NOW },
      }),
    })
    assert.equal(new LocalStorageProfileRepository(invalid).load().ok, false)
  })

  it('rejects an oversized or unnormalized CV text', () => {
    const repository = new LocalStorageProfileRepository(new MemoryStorage())

    assert.equal(repository.save(profileWith([], { cvText: 'c'.repeat(20001) })).status, 'invalid_data')
    assert.equal(repository.save(profileWith([], { cvText: '  espacios  ' })).status, 'invalid_data')
  })
})
