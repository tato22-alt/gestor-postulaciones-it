// Returns an ISO timestamp that is never earlier than the requested time and always
// strictly later than the current version, so optimistic-concurrency checks can rely on it.
export default function createNextUpdatedAt(currentUpdatedAt, now) {
  const currentTime = new Date(currentUpdatedAt).getTime()
  const requestedTime = new Date(now).getTime()

  if (Number.isNaN(currentTime) || Number.isNaN(requestedTime)) {
    return null
  }

  return new Date(Math.max(requestedTime, currentTime + 1)).toISOString()
}
