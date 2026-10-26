import CandidateProfile from '../domain/CandidateProfile.js'
import { getSkillKey, hasSkill } from '../domain/candidateSkillsPolicy.js'
import createNextUpdatedAt from './createNextUpdatedAt.js'
import { normalizeSkillInput, validateSkillInput } from './profileInput.js'

/**
 * Adds a skill to the profile, creating the profile on the first skill. Returns a new
 * CandidateProfile and never mutates the current one.
 */
export function addProfileSkill(profile, { skill, now = new Date() }) {
  const currentSkills = profile?.skills ?? []
  const error = validateSkillInput(skill, currentSkills)

  if (error) {
    return { ok: false, status: 'invalid_input', error }
  }

  const nextSkill = normalizeSkillInput(skill)
  const timestamp = new Date(now).toISOString()

  if (!profile) {
    return {
      ok: true,
      status: 'created',
      profile: new CandidateProfile({ skills: [nextSkill], createdAt: timestamp }),
    }
  }

  return {
    ok: true,
    status: 'updated',
    profile: new CandidateProfile({
      ...profile,
      skills: [...currentSkills, nextSkill],
      updatedAt: createNextUpdatedAt(profile.updatedAt, now),
    }),
  }
}

export function removeProfileSkill(profile, { skill, now = new Date() }) {
  if (!profile || !hasSkill(profile.skills, skill)) {
    return { ok: false, status: 'not_found' }
  }

  const key = getSkillKey(skill)

  return {
    ok: true,
    status: 'updated',
    profile: new CandidateProfile({
      ...profile,
      skills: profile.skills.filter((current) => getSkillKey(current) !== key),
      updatedAt: createNextUpdatedAt(profile.updatedAt, now),
    }),
  }
}
