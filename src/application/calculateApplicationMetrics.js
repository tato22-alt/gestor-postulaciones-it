import { APPLICATION_STATUSES } from '../constants/domainOptions.js'
import { isFinalApplicationStatus } from '../domain/applicationStatusPolicy.js'

function calculatePercentage(count, total) {
  return total === 0 ? null : Math.round((count / total) * 100)
}

export default function calculateApplicationMetrics({ applications }) {
  const totalApplications = applications.length
  const applicationsByStatus = Object.fromEntries(
    Object.values(APPLICATION_STATUSES).map((option) => {
      const count = applications.filter(
        (application) => application.status === option.value,
      ).length

      return [option.value, { count, percentage: calculatePercentage(count, totalApplications) }]
    }),
  )
  const activeApplications = applications.filter(
    (application) => !isFinalApplicationStatus(application.status),
  ).length

  return {
    totalApplications,
    activeApplications,
    applicationsByStatus,
  }
}
