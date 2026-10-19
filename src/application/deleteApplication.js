export default function deleteApplication(applications, { id, expectedUpdatedAt } = {}) {
  if (!Array.isArray(applications)) {
    return { ok: false, status: 'invalid_collection' }
  }

  const application = applications.find((current) => current?.id === id)

  if (!application) {
    return { ok: false, status: 'not_found' }
  }

  if (application.updatedAt !== expectedUpdatedAt) {
    return { ok: false, status: 'conflict' }
  }

  return {
    ok: true,
    status: 'deleted',
    applications: applications.filter((current) => current.id !== id),
  }
}
