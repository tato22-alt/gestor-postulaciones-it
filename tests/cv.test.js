import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { addProfileSkills, setProfileCv } from '../src/application/manageProfile.js'
import CandidateProfile from '../src/domain/CandidateProfile.js'
import {
  CV_TEXT_MAX_LENGTH,
  REDACTED_PLACEHOLDER as X,
  isValidCvText,
  normalizeCvText,
  redactContactData,
} from '../src/domain/cvPolicy.js'
import { createBackupText, parseBackupText } from '../src/infrastructure/backupFile.js'
import { createRequiredSkillsClient } from '../src/infrastructure/requiredSkillsClient.js'

const NOW = '2026-01-10T12:00:00.000Z'
const LATER = '2026-01-11T12:00:00.000Z'
const profileWith = (overrides = {}) => new CandidateProfile({ id: 'p', createdAt: NOW, ...overrides })

describe('redactContactData', () => {
  it('removes emails, links, phones, DNI, and CUIL', () => {
    const cases = {
      'ana.perez+cv@example.com': X,
      'Mail: ana@example.com.ar.': `Mail: ${X}`,
      'https://ana.dev/portfolio': X,
      'www.ana.dev': X,
      'linkedin.com/in/ana-perez': X,
      'github.com/ana': X,
      '+54 9 11 2345-6789': X,
      '(011) 4567-8901': X,
      '1123456789': X,
      '11.2345.6789': X,
      'Tel 11 2345 6789.': `Tel ${X}.`,
      'DNI 12.345.678': `DNI ${X}`,
      'DNI 7345678': `DNI ${X}`,
      'CUIL 20-12345678-3': `CUIL ${X}`,
      'CUIT 27123456784': `CUIT ${X}`,
    }

    for (const [input, expected] of Object.entries(cases)) {
      assert.equal(redactContactData(input).text, expected, input)
    }
  })

  it('keeps skills, years, year ranges, and short numbers', () => {
    const text = 'Java, C#, .NET 8, SQL Server 2019. Soporte IT 2019 - 2023, Analista 2023-2024. 20 horas, promedio 8.5'

    assert.deepEqual(redactContactData(text), { text, removedCount: 0 })
  })

  it('counts every removed value', () => {
    assert.equal(redactContactData('a@b.co | +54 11 2345-6789 | DNI 12.345.678').removedCount, 3)
    assert.deepEqual(redactContactData(null), { text: '', removedCount: 0 })
  })
})

describe('CV text rules', () => {
  it('normalizes spacing but keeps paragraphs', () => {
    assert.equal(normalizeCvText('  Hola \t mundo \r\n\r\n\r\n\r\nSkills:  Java  '), 'Hola mundo\n\nSkills: Java')
    assert.equal(isValidCvText(''), true)
    assert.equal(isValidCvText('c'.repeat(CV_TEXT_MAX_LENGTH + 1)), false)
    assert.equal(isValidCvText(' x'), false)
    assert.equal(isValidCvText(3), false)
  })
})

describe('profile CV use cases', () => {
  it('saves a normalized CV, creating the profile when needed', () => {
    const created = setProfileCv(null, { cvText: '  Mi CV  ', now: NOW })

    assert.equal(created.status, 'created')
    assert.equal(created.profile.cvText, 'Mi CV')
    assert.deepEqual(created.profile.skills, [])

    const updated = setProfileCv(created.profile, { cvText: 'Otro CV', now: LATER })
    assert.equal(updated.profile.cvText, 'Otro CV')
    assert.equal(updated.profile.updatedAt, LATER)
    assert.equal(setProfileCv(updated.profile, { cvText: 'Otro CV ' }).status, 'unchanged')
    assert.equal(setProfileCv(null, { cvText: 'c'.repeat(CV_TEXT_MAX_LENGTH + 1) }).error, 'too_long')
  })

  it('adds confirmed skills once, keeping existing ones and the CV', () => {
    const current = profileWith({ skills: ['Java'], cvText: 'CV' })
    const result = addProfileSkills(current, { skills: ['java', 'SQL  Server', '', 'x'.repeat(61), 'Git'], now: LATER })

    assert.deepEqual(result.profile.skills, ['Java', 'SQL Server', 'Git'])
    assert.equal(result.profile.cvText, 'CV')
    assert.deepEqual(current.skills, ['Java'])
    assert.equal(addProfileSkills(current, { skills: ['JAVA'] }).status, 'unchanged')
    assert.deepEqual(addProfileSkills(null, { skills: ['Git'], now: NOW }).profile.skills, ['Git'])
  })
})

describe('CV in backups', () => {
  it('round-trips the CV in a version 6 backup and still reads version 5 profiles', () => {
    const profile = profileWith({ skills: ['Java'], cvText: 'Soporte IT\n\nJava' })
    const text = createBackupText({ opportunities: [], applications: [], sources: [], profile, now: NOW })
    const parsed = parseBackupText(text)

    assert.equal(JSON.parse(text).schemaVersion, 6)
    assert.equal(parsed.profile.cvText, 'Soporte IT\n\nJava')

    const v5 = JSON.parse(text)
    v5.schemaVersion = 5
    delete v5.profile.cvText
    assert.equal(parseBackupText(JSON.stringify(v5)).profile.cvText, '')

    const v5WithCv = JSON.parse(text)
    v5WithCv.schemaVersion = 5
    assert.equal(parseBackupText(JSON.stringify(v5WithCv)).status, 'invalid_records')

    const oversized = JSON.parse(text)
    oversized.profile.cvText = 'c'.repeat(CV_TEXT_MAX_LENGTH + 1)
    assert.equal(parseBackupText(JSON.stringify(oversized)).status, 'invalid_records')
  })
})

describe('requiredSkillsClient CV mode', () => {
  it('sends only the kind and the text', async () => {
    let body
    const client = createRequiredSkillsClient({
      supabaseUrl: 'https://proj.supabase.co',
      publishableKey: 'sb_publishable_x',
      fetchImpl: async (_url, options) => {
        body = JSON.parse(options.body)
        return Response.json({ ok: true, skills: ['Java'] })
      },
    })

    assert.deepEqual(await client.extractFromCv({ text: 'Java' }), { ok: true, skills: ['Java'] })
    assert.deepEqual(body, { kind: 'cv', text: 'Java' })
  })
})
