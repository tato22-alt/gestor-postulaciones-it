import {
  EMPLOYMENT_TYPES,
  MODALITIES,
  OPPORTUNITY_STATUSES,
} from '../constants/domainOptions.js'

function calculatePercentage(count, total) {
  return total === 0 ? null : Math.round((count / total) * 100)
}

function createControlledBreakdown(opportunities, options, selectValue) {
  const total = opportunities.length

  return Object.fromEntries(
    Object.values(options).map((option) => {
      const count = opportunities.filter(
        (opportunity) => selectValue(opportunity) === option.value,
      ).length

      return [
        option.value,
        {
          count,
          percentage: calculatePercentage(count, total),
        },
      ]
    }),
  )
}

function createMetric(count, total) {
  return {
    count,
    percentage: calculatePercentage(count, total),
  }
}

function getStartOfCurrentWeek(now) {
  const startOfWeek = new Date(now)
  const daysSinceMonday = (startOfWeek.getDay() + 6) % 7

  startOfWeek.setDate(startOfWeek.getDate() - daysSinceMonday)
  startOfWeek.setHours(0, 0, 0, 0)

  return startOfWeek
}

function wasCreatedThisWeek(createdAt, startOfWeek, now) {
  const createdDate = new Date(createdAt)

  return (
    !Number.isNaN(createdDate.getTime()) &&
    createdDate >= startOfWeek &&
    createdDate <= now
  )
}

export default function calculateDashboardMetrics({
  opportunities,
  now = new Date(),
}) {
  const currentDate = new Date(now)
  const startOfWeek = getStartOfCurrentWeek(currentDate)
  const totalOpportunities = opportunities.length
  const opportunitiesWithPublicationDate = opportunities.filter(
    (opportunity) => opportunity.publishedAt !== null,
  ).length
  const opportunitiesWithoutPublicationDate =
    totalOpportunities - opportunitiesWithPublicationDate
  const opportunitiesWithoutModality = opportunities.filter(
    (opportunity) => opportunity.modality === null,
  ).length
  const opportunitiesWithoutEmploymentType = opportunities.filter(
    (opportunity) => opportunity.employmentType === null,
  ).length
  const opportunitiesAddedThisWeek = opportunities.filter((opportunity) =>
    wasCreatedThisWeek(opportunity.createdAt, startOfWeek, currentDate),
  ).length
  const opportunitiesByStatus = createControlledBreakdown(
    opportunities,
    OPPORTUNITY_STATUSES,
    (opportunity) => opportunity.status,
  )

  return {
    totalOpportunities,
    detectedOpportunities:
      opportunitiesByStatus[OPPORTUNITY_STATUSES.DETECTED.value].count,
    opportunitiesAddedThisWeek,
    opportunitiesByStatus,
    publicationDate: {
      withDate: createMetric(opportunitiesWithPublicationDate, totalOpportunities),
      withoutDate: createMetric(opportunitiesWithoutPublicationDate, totalOpportunities),
    },
    modality: {
      values: createControlledBreakdown(
        opportunities,
        MODALITIES,
        (opportunity) => opportunity.modality,
      ),
      unspecified: createMetric(opportunitiesWithoutModality, totalOpportunities),
    },
    employmentType: {
      values: createControlledBreakdown(
        opportunities,
        EMPLOYMENT_TYPES,
        (opportunity) => opportunity.employmentType,
      ),
      unspecified: createMetric(
        opportunitiesWithoutEmploymentType,
        totalOpportunities,
      ),
    },
  }
}
