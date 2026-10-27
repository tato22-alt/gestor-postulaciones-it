import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import CandidateProfile from '../src/domain/CandidateProfile.js'
import JobSearchPreferences from '../src/domain/JobSearchPreferences.js'
import MatchResult from '../src/domain/MatchResult.js'
import {
  MATCH_ITEM_TYPES as T,
  analyzeCompatibility,
  hasCompatibilityCriteria,
} from '../src/domain/compatibilityPolicy.js'
import { createOpportunity } from './helpers.js'

const NOW = '2026-01-10T12:00:00.000Z'
const profile = (skills) => new CandidateProfile({ id: 'candidate', skills, createdAt: NOW })
const preferences = (overrides) => new JobSearchPreferences({ id: 'prefs', createdAt: NOW, ...overrides })
const analyze = (opportunityOverrides, { skills = [], prefs = {} } = {}) =>
  analyzeCompatibility({
    opportunity: createOpportunity(opportunityOverrides),
    profile: profile(skills),
    preferences: preferences(prefs),
    now: NOW,
  })
const types = (items) => items.map((item) => item.type)

describe('compatibilityPolicy', () => {
  it('returns an explainable MatchResult without score or recommendation', () => {
    const result = analyze({ description: 'Usamos React.' }, { skills: ['React'] })

    assert.ok(result instanceof MatchResult)
    assert.equal(result.score, null)
    assert.equal(result.recommendation, null)
    assert.equal(result.candidateId, 'candidate')
    assert.equal(result.opportunityId, 'opportunity-1')
    assert.equal(result.evaluatedAt, NOW)
    assert.deepEqual(result.missingSkills, [])
  })

  it('lists the skills mentioned in the title or description, ignoring case and accents', () => {
    const result = analyze(
      { title: 'Desarrollador React', description: 'Buscamos experiencia en SQL SERVER y gestion de proyectos.' },
      { skills: ['react', 'SQL Server', 'Gestión de proyectos', 'Python'] },
    )

    assert.deepEqual(result.strengths, [
      { type: T.SKILLS_MENTIONED, values: ['react', 'SQL Server', 'Gestión de proyectos'] },
    ])
  })

  it('matches whole words only', () => {
    const description = 'Stack: JavaScript, C++ y C#. Experiencia con .NET y Node.js.'
    const mentioned = (skills) => analyze({ description }, { skills }).strengths[0]?.values ?? []

    assert.deepEqual(mentioned(['Java']), [])
    assert.deepEqual(mentioned(['C']), [])
    assert.deepEqual(mentioned(['C++', 'C#', '.NET', 'Node.js', 'JavaScript']), ['C++', 'C#', '.NET', 'Node.js', 'JavaScript'])
    assert.deepEqual(mentioned(['Script']), [])
  })

  it('treats missing skill mentions as unknown, never as a warning', () => {
    assert.deepEqual(types(analyze({ description: 'Buscamos Go.' }, { skills: ['React'] }).unknowns), [T.SKILLS_NOT_MENTIONED])
    assert.deepEqual(types(analyze({ description: '' }, { skills: ['React'] }).unknowns), [T.NO_TEXT_FOR_SKILLS])
    assert.deepEqual(analyze({ description: 'Buscamos Go.' }, { skills: ['React'] }).warnings, [])
  })

  it('compares the title with target roles without warning when they differ', () => {
    const matched = analyze({ title: 'Desarrollador Trainee Java' }, { prefs: { targetRoles: ['desarrollador trainee', 'QA'] } })
    const unmatched = analyze({ title: 'Analista de datos' }, { prefs: { targetRoles: ['QA'] } })

    assert.deepEqual(matched.strengths, [{ type: T.ROLE_MATCHED, values: ['desarrollador trainee'] }])
    assert.deepEqual(types(unmatched.unknowns), [T.ROLE_NOT_MATCHED])
    assert.deepEqual(unmatched.warnings, [])
  })

  it('compares modality and employment type: match, warning, or unknown', () => {
    const prefs = { preferredModalities: ['remote', 'hybrid'], acceptedEmploymentTypes: ['internship'] }

    assert.deepEqual(analyze({ modality: 'remote', employmentType: 'internship' }, { prefs }).strengths, [
      { type: T.MODALITY_PREFERRED, values: ['remote'] },
      { type: T.EMPLOYMENT_TYPE_ACCEPTED, values: ['internship'] },
    ])
    assert.deepEqual(analyze({ modality: 'on_site', employmentType: 'full_time' }, { prefs }).warnings, [
      { type: T.MODALITY_NOT_PREFERRED, values: ['on_site'] },
      { type: T.EMPLOYMENT_TYPE_NOT_ACCEPTED, values: ['full_time'] },
    ])
    assert.deepEqual(types(analyze({ modality: null, employmentType: null }, { prefs }).unknowns), [
      T.MODALITY_UNKNOWN,
      T.EMPLOYMENT_TYPE_UNKNOWN,
    ])
  })

  it('skips every criterion the user did not set', () => {
    const result = analyze({ modality: 'on_site', employmentType: 'full_time', description: '' })

    assert.deepEqual([result.strengths, result.warnings, result.unknowns], [[], [], []])
    assert.equal(hasCompatibilityCriteria(profile([]), preferences({})), false)
    assert.equal(hasCompatibilityCriteria(null, null), false)
    assert.equal(hasCompatibilityCriteria(profile(['Git']), null), true)
    assert.equal(hasCompatibilityCriteria(null, preferences({ preferredModalities: ['remote'] })), true)
  })

  it('works without a profile or preferences and does not mutate inputs', () => {
    const opportunity = createOpportunity({ modality: 'remote' })
    const prefs = preferences({ preferredModalities: ['remote'] })
    const before = JSON.stringify([opportunity, prefs])
    const result = analyzeCompatibility({ opportunity, preferences: prefs, now: NOW })

    assert.equal(result.candidateId, null)
    assert.deepEqual(types(result.strengths), [T.MODALITY_PREFERRED])
    assert.equal(JSON.stringify([opportunity, prefs]), before)
  })
})
