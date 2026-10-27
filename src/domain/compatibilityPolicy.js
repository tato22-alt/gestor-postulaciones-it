import MatchResult from './MatchResult.js'
import { getListTextKey } from './textListPolicy.js'

/**
 * Rule-based compatibility, first version (no score and no recommendation). It compares an
 * opportunity with the candidate's skills and search preferences and explains the result:
 * - strengths: what matches;
 * - warnings: a known value outside the preferences (a warning, never a rejection);
 * - unknowns: what cannot be compared because a value is missing (never negative).
 * Each item is a controlled type plus the related value; labels belong to the interface.
 */
export const MATCH_ITEM_TYPES = Object.freeze({
  SKILLS_MENTIONED: 'skills_mentioned',
  SKILLS_NOT_MENTIONED: 'skills_not_mentioned',
  NO_TEXT_FOR_SKILLS: 'no_text_for_skills',
  ROLE_MATCHED: 'role_matched',
  ROLE_NOT_MATCHED: 'role_not_matched',
  MODALITY_PREFERRED: 'modality_preferred',
  MODALITY_NOT_PREFERRED: 'modality_not_preferred',
  MODALITY_UNKNOWN: 'modality_unknown',
  EMPLOYMENT_TYPE_ACCEPTED: 'employment_type_accepted',
  EMPLOYMENT_TYPE_NOT_ACCEPTED: 'employment_type_not_accepted',
  EMPLOYMENT_TYPE_UNKNOWN: 'employment_type_unknown',
})

const WORD_CHARACTER = /[a-z0-9]/
// A skill such as "C" must not match "C++" or "C#", and "Java" must not match "JavaScript".
const SKILL_SUFFIX_CHARACTER = /[a-z0-9+#]/

// True when `phrase` appears in `text` as whole words. Both are comparison keys.
function containsPhrase(text, phrase) {
  if (!phrase) return false

  let index = text.indexOf(phrase)

  while (index !== -1) {
    const before = text[index - 1] ?? ''
    const after = text[index + phrase.length] ?? ''
    const startsWithWord = WORD_CHARACTER.test(phrase[0])
    const endsWithWord = WORD_CHARACTER.test(phrase[phrase.length - 1])

    if ((!startsWithWord || !WORD_CHARACTER.test(before)) && (!endsWithWord || !SKILL_SUFFIX_CHARACTER.test(after))) {
      return true
    }

    index = text.indexOf(phrase, index + 1)
  }

  return false
}

function compareOption({ preferred, value, matched, notMatched, unknown }, result) {
  if (preferred.length === 0) return

  if (!value) {
    result.unknowns.push({ type: unknown })
  } else if (preferred.includes(value)) {
    result.strengths.push({ type: matched, values: [value] })
  } else {
    result.warnings.push({ type: notMatched, values: [value] })
  }
}

// Returns true when there is something to compare (skills or at least one preference).
export function hasCompatibilityCriteria(profile, preferences) {
  return Boolean(
    profile?.skills.length ||
      preferences?.targetRoles.length ||
      preferences?.preferredModalities.length ||
      preferences?.acceptedEmploymentTypes.length,
  )
}

export function analyzeCompatibility({ opportunity, profile = null, preferences = null, now = new Date() }) {
  const result = { strengths: [], warnings: [], unknowns: [] }
  const skills = profile?.skills ?? []
  const text = getListTextKey(`${opportunity.title} ${opportunity.description ?? ''}`)

  if (skills.length > 0) {
    if (!getListTextKey(opportunity.description)) {
      result.unknowns.push({ type: MATCH_ITEM_TYPES.NO_TEXT_FOR_SKILLS })
    }

    const mentioned = skills.filter((skill) => containsPhrase(text, getListTextKey(skill)))

    if (mentioned.length > 0) {
      result.strengths.push({ type: MATCH_ITEM_TYPES.SKILLS_MENTIONED, values: mentioned })
    } else if (getListTextKey(opportunity.description)) {
      result.unknowns.push({ type: MATCH_ITEM_TYPES.SKILLS_NOT_MENTIONED })
    }
  }

  const roles = preferences?.targetRoles ?? []

  if (roles.length > 0) {
    const title = getListTextKey(opportunity.title)
    const matchedRoles = roles.filter((role) => containsPhrase(title, getListTextKey(role)))

    // Job titles vary a lot, so a title that does not contain a role is not a warning.
    if (matchedRoles.length > 0) {
      result.strengths.push({ type: MATCH_ITEM_TYPES.ROLE_MATCHED, values: matchedRoles })
    } else {
      result.unknowns.push({ type: MATCH_ITEM_TYPES.ROLE_NOT_MATCHED })
    }
  }

  compareOption(
    {
      preferred: preferences?.preferredModalities ?? [],
      value: opportunity.modality,
      matched: MATCH_ITEM_TYPES.MODALITY_PREFERRED,
      notMatched: MATCH_ITEM_TYPES.MODALITY_NOT_PREFERRED,
      unknown: MATCH_ITEM_TYPES.MODALITY_UNKNOWN,
    },
    result,
  )
  compareOption(
    {
      preferred: preferences?.acceptedEmploymentTypes ?? [],
      value: opportunity.employmentType,
      matched: MATCH_ITEM_TYPES.EMPLOYMENT_TYPE_ACCEPTED,
      notMatched: MATCH_ITEM_TYPES.EMPLOYMENT_TYPE_NOT_ACCEPTED,
      unknown: MATCH_ITEM_TYPES.EMPLOYMENT_TYPE_UNKNOWN,
    },
    result,
  )

  return new MatchResult({
    candidateId: profile?.id ?? null,
    opportunityId: opportunity.id,
    ...result,
    evaluatedAt: new Date(now).toISOString(),
  })
}
