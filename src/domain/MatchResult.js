class MatchResult {
  constructor({
    id = crypto.randomUUID(),
    candidateId = null,
    opportunityId = null,
    score = null,
    recommendation = null,
    strengths = [],
    warnings = [],
    missingSkills = [],
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
    this.evaluatedAt = evaluatedAt
  }
}

export default MatchResult
