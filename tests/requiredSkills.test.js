import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import setRequiredSkills, { normalizeRequiredSkills } from '../src/application/manageRequiredSkills.js'
import CandidateProfile from '../src/domain/CandidateProfile.js'
import JobOpportunity from '../src/domain/JobOpportunity.js'
import { MATCH_ITEM_TYPES as T, analyzeCompatibility } from '../src/domain/compatibilityPolicy.js'
import { createRequiredSkillsClient } from '../src/infrastructure/requiredSkillsClient.js'
import { BASE_TIMESTAMP, createOpportunity } from './helpers.js'

const LATER = '2026-01-11T12:00:00.000Z'

describe('setRequiredSkills', () => {
  it('replaces the required skills with a normalized, unique list', () => {
    const opportunity = createOpportunity()
    const result = setRequiredSkills([opportunity], {
      id: opportunity.id,
      expectedUpdatedAt: opportunity.updatedAt,
      skills: [' Docker ', 'docker', 'SQL   Server', '', 'x'.repeat(61), 42],
      now: LATER,
    })

    assert.equal(result.ok, true)
    assert.ok(result.opportunity instanceof JobOpportunity)
    assert.deepEqual(result.opportunity.requiredSkills, ['Docker', 'SQL Server'])
    assert.equal(result.opportunity.updatedAt, LATER)
    assert.equal(result.opportunity.title, opportunity.title)
    assert.deepEqual(opportunity.requiredSkills, [])
  })

  it('detects stale versions and missing opportunities', () => {
    const opportunity = createOpportunity()

    assert.equal(setRequiredSkills([opportunity], { id: opportunity.id, expectedUpdatedAt: 'old', skills: [] }).status, 'conflict')
    assert.equal(setRequiredSkills([opportunity], { id: 'missing', expectedUpdatedAt: BASE_TIMESTAMP, skills: [] }).status, 'not_found')
  })

  it('normalizes any input shape safely', () => {
    assert.deepEqual(normalizeRequiredSkills(null), [])
    assert.deepEqual(normalizeRequiredSkills(['Git', 'GIT', 'Gestión', 'gestion']), ['Git', 'Gestión'])
  })
})

describe('compatibility with required skills', () => {
  const profile = new CandidateProfile({ id: 'c', skills: ['React', 'Git', 'Excel'], createdAt: BASE_TIMESTAMP })

  it('reports required skills met and missing, without repeating them as mentioned', () => {
    const result = analyzeCompatibility({
      opportunity: createOpportunity({ description: 'React, Docker y Git. También Excel.', requiredSkills: ['react', 'Docker'] }),
      profile,
      now: BASE_TIMESTAMP,
    })

    assert.deepEqual(result.strengths, [
      { type: T.REQUIRED_SKILLS_MET, values: ['react'] },
      { type: T.SKILLS_MENTIONED, values: ['Git', 'Excel'] },
    ])
    assert.deepEqual(result.missingSkills, ['Docker'])
    assert.deepEqual(result.unknowns, [])
  })

  it('does not list missing skills when the profile has no skills', () => {
    const result = analyzeCompatibility({
      opportunity: createOpportunity({ requiredSkills: ['Docker'] }),
      profile: new CandidateProfile({ skills: [] }),
    })

    assert.deepEqual(result.missingSkills, [])
  })
})

describe('requiredSkillsClient', () => {
  const create = (fetchImpl) =>
    createRequiredSkillsClient({ supabaseUrl: 'https://proj.supabase.co/', publishableKey: 'sb_publishable_x', fetchImpl })

  it('posts the opportunity text with the public key and returns skills', async () => {
    let request
    const client = create(async (url, options) => {
      request = { url, options }
      return Response.json({ ok: true, skills: ['React', 3, 'Git'] })
    })

    assert.deepEqual(await client.extract({ title: 'Dev', description: 'React y Git' }), { ok: true, skills: ['React', 'Git'] })
    assert.equal(request.url, 'https://proj.supabase.co/functions/v1/extract-required-skills')
    assert.equal(request.options.headers.apikey, 'sb_publishable_x')
    assert.equal(request.options.headers.Authorization, undefined)
    assert.deepEqual(JSON.parse(request.options.body), { title: 'Dev', description: 'React y Git' })
  })

  it('maps errors to known codes only', async () => {
    assert.deepEqual(await create(async () => Response.json({ ok: false, error: 'rate_limited' }, { status: 429 })).extract({}), {
      ok: false,
      status: 'rate_limited',
    })
    assert.equal((await create(async () => Response.json({ ok: false, error: '<b>stack</b>' }, { status: 500 })).extract({})).status, 'unavailable')
    assert.equal((await create(async () => new Response('not json', { status: 502 })).extract({})).status, 'unavailable')
    assert.equal(
      (await create(async () => {
        throw new TypeError('Failed to fetch')
      }).extract({})).status,
      'network',
    )
  })
})
