// Calls the `extract-required-skills` Edge Function. The AI provider key lives only in the
// function; this client sends the public project key and the opportunity text.

const REQUEST_TIMEOUT_MS = 30000
const KNOWN_ERRORS = new Set([
  'invalid_input',
  'rate_limited',
  'provider_busy',
  'provider_error',
  'invalid_output',
  'timeout',
  'not_configured',
  'unavailable',
])

export function createRequiredSkillsClient({ supabaseUrl, publishableKey, fetchImpl = globalThis.fetch }) {
  const endpoint = `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/extract-required-skills`

  return {
    async extract({ title, description }) {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

      try {
        const response = await fetchImpl(endpoint, {
          method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json', apikey: publishableKey },
          body: JSON.stringify({ title, description }),
        })

        let payload = null

        try {
          payload = await response.json()
        } catch {
          payload = null
        }

        if (response.ok && payload?.ok === true && Array.isArray(payload.skills)) {
          return { ok: true, skills: payload.skills.filter((skill) => typeof skill === 'string') }
        }

        const error = typeof payload?.error === 'string' && KNOWN_ERRORS.has(payload.error) ? payload.error : 'unavailable'
        return { ok: false, status: error }
      } catch (error) {
        return { ok: false, status: error?.name === 'AbortError' ? 'timeout' : 'network' }
      } finally {
        clearTimeout(timer)
      }
    },
  }
}
