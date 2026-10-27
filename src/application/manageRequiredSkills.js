import { getSkillKey, isValidSkillList, normalizeSkill } from '../domain/candidateSkillsPolicy.js'
import JobOpportunity from '../domain/JobOpportunity.js'
import createNextUpdatedAt from './createNextUpdatedAt.js'

// Turns suggested or typed values into a valid skill list: trimmed, unique by comparison
// key, and within the skill limits. Invalid entries are dropped.
export function normalizeRequiredSkills(values) {
  const seen = new Set()
  const skills = []

  for (const value of Array.isArray(values) ? values : []) {
    const skill = normalizeSkill(value)
    const key = getSkillKey(skill)

    if (!skill || seen.has(key) || !isValidSkillList([skill])) continue

    seen.add(key)
    skills.push(skill)
  }

  return skills
}

/**
 * Replaces the required skills of one opportunity. Only the user's confirmed list reaches
 * this use case: AI suggestions are reviewed in the interface first.
 */
export default function setRequiredSkills(opportunities, { id, expectedUpdatedAt, skills, now = new Date() }) {
  const index = opportunities.findIndex((opportunity) => opportunity.id === id)

  if (index === -1) {
    return { ok: false, status: 'not_found' }
  }

  const current = opportunities[index]

  if (current.updatedAt !== expectedUpdatedAt) {
    return { ok: false, status: 'conflict' }
  }

  const nextSkills = normalizeRequiredSkills(skills)

  if (!isValidSkillList(nextSkills)) {
    return { ok: false, status: 'invalid_input' }
  }

  const updated = new JobOpportunity({
    ...current,
    requiredSkills: nextSkills,
    updatedAt: createNextUpdatedAt(current.updatedAt, now),
  })

  return {
    ok: true,
    status: 'updated',
    opportunity: updated,
    opportunities: opportunities.map((opportunity, position) => (position === index ? updated : opportunity)),
  }
}
