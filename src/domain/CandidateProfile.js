class CandidateProfile {
  constructor({
    id = crypto.randomUUID(),
    name = '',
    city = '',
    education = [],
    skills = [],
    experienceSummary = '',
    languages = [],
    cvReference = '',
    createdAt = new Date().toISOString(),
    updatedAt = createdAt,
  } = {}) {
    this.id = id
    this.name = name
    this.city = city
    this.education = [...education]
    this.skills = [...skills]
    this.experienceSummary = experienceSummary
    this.languages = [...languages]
    this.cvReference = cvReference
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }
}

export default CandidateProfile
