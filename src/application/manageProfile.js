import CandidateProfile from '../domain/CandidateProfile.js'
import { getSkillKey, hasSkill, isValidSkillList, normalizeSkill } from '../domain/candidateSkillsPolicy.js'
import { CV_TEXT_MAX_LENGTH, normalizeCvText } from '../domain/cvPolicy.js'
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

// Creates the profile when needed, or returns a new instance with the changes applied.
function applyProfileChanges(profile, changes, now) {
  if (!profile) {
    return {
      ok: true,
      status: 'created',
      profile: new CandidateProfile({ ...changes, createdAt: new Date(now).toISOString() }),
    }
  }

  return {
    ok: true,
    status: 'updated',
    profile: new CandidateProfile({
      ...profile,
      ...changes,
      updatedAt: createNextUpdatedAt(profile.updatedAt, now),
    }),
  }
}

// Adds the skills the user confirmed from the CV suggestions. Skills already in the profile
// or invalid entries are skipped.
export function addProfileSkills(profile, { skills, now = new Date() }) {
  const nextSkills = [...(profile?.skills ?? [])]

  for (const value of Array.isArray(skills) ? skills : []) {
    const skill = normalizeSkill(value)

    if (skill && !hasSkill(nextSkills, skill) && isValidSkillList([...nextSkills, skill])) {
      nextSkills.push(skill)
    }
  }

  if (nextSkills.length === (profile?.skills.length ?? 0)) {
    return { ok: false, status: 'unchanged' }
  }

  return applyProfileChanges(profile, { skills: nextSkills }, now)
}

export function setProfileCv(profile, { cvText, now = new Date() }) {
  const nextCvText = normalizeCvText(cvText)

  if (nextCvText.length > CV_TEXT_MAX_LENGTH) {
    return { ok: false, status: 'invalid_input', error: 'too_long' }
  }

  if (nextCvText === (profile?.cvText ?? '')) {
    return { ok: false, status: 'unchanged' }
  }

  return applyProfileChanges(profile, { cvText: nextCvText }, now)
}
