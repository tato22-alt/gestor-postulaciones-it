export default function deleteOpportunity(opportunities, { id, expectedUpdatedAt } = {}) {
  if (!Array.isArray(opportunities)) {
    return { ok: false, status: 'invalid_collection' }
  }

  const opportunityIndex = opportunities.findIndex((opp) => opp?.id === id)

  if (opportunityIndex === -1) {
    return { ok: false, status: 'not_found' }
  }

  const currentOpportunity = opportunities[opportunityIndex]

  if (currentOpportunity.updatedAt !== expectedUpdatedAt) {
    return { ok: false, status: 'conflict' }
  }

  const nextOpportunities = opportunities.filter((_, index) => index !== opportunityIndex)

  return {
    ok: true,
    status: 'deleted',
    opportunities: nextOpportunities,
  }
}
