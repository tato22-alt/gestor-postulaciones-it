import { generateId } from '../utils/id.js'

class MatchResult {
  constructor({
    id = generateId(),
    candidateId = null,
    opportunityId = null,
    score = null,
    recommendation = null,
    strengths = [],
    warnings = [],
    missingSkills = [],
    unknowns = [],
    evaluatedAt = new Date().toISOString(),
  } = {}) {
    this.id = id
    this.candidateId = candidateId
    this.opportunityId = opportunityId
    this.score = score
    this.recommendation = recommendation
    this.strengths = [...strengths]
    this.warnings = [...warnings]
    this.missingSkills = [...missingSkills]
    this.unknowns = [...unknowns]
    this.evaluatedAt = evaluatedAt
  }
}

export default MatchResult
