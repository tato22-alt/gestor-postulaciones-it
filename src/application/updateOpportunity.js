import JobOpportunity from '../domain/JobOpportunity.js'
import {
  normalizeOpportunityInput,
  validateOpportunityInput,
} from './opportunityInput.js'

function createNextUpdatedAt(currentUpdatedAt, now) {
  const currentTime = new Date(currentUpdatedAt).getTime()
  const requestedTime = new Date(now).getTime()

  if (Number.isNaN(currentTime) || Number.isNaN(requestedTime)) {
    return null
  }

  return new Date(Math.max(requestedTime, currentTime + 1)).toISOString()
}

export default function updateOpportunity(
  opportunities,
  {
    id,
    expectedUpdatedAt,
    changes,
    now = new Date(),
  } = {},
) {
  if (!Array.isArray(opportunities)) {
    return { ok: false, status: 'invalid_collection' }
  }

  const opportunityIndex = opportunities.findIndex(
    (opportunity) => opportunity?.id === id,
  )

  if (opportunityIndex === -1) {
    return { ok: false, status: 'not_found' }
  }

  const currentOpportunity = opportunities[opportunityIndex]

  if (currentOpportunity.updatedAt !== expectedUpdatedAt) {
    return { ok: false, status: 'conflict' }
  }

  const validationErrors = validateOpportunityInput(changes)

  if (Object.keys(validationErrors).length > 0) {
    return {
      ok: false,
      status: 'invalid_input',
      errors: validationErrors,
    }
  }

  const updatedAt = createNextUpdatedAt(currentOpportunity.updatedAt, now)

  if (updatedAt === null) {
    return { ok: false, status: 'invalid_timestamp' }
  }

  const updatedOpportunity = new JobOpportunity({
    ...currentOpportunity,
    ...normalizeOpportunityInput(changes),
    id: currentOpportunity.id,
    sourceId: currentOpportunity.sourceId,
    detectedAt: currentOpportunity.detectedAt,
    status: currentOpportunity.status,
    createdAt: currentOpportunity.createdAt,
    updatedAt,
  })
  const nextOpportunities = [...opportunities]

  nextOpportunities[opportunityIndex] = updatedOpportunity

  return {
    ok: true,
    status: 'updated',
    opportunity: updatedOpportunity,
    opportunities: nextOpportunities,
  }
}
