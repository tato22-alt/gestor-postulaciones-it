// Loads Google Identity Services and requests short-lived access tokens in the browser.
// Tokens stay in memory only: they are never written to storage, logs, or URLs.
const GOOGLE_IDENTITY_SCRIPT = 'https://accounts.google.com/gsi/client'
export const DRIVE_APPDATA_SCOPE = 'https://www.googleapis.com/auth/drive.appdata'

let scriptPromise = null

function loadGoogleIdentity() {
  if (window.google?.accounts?.oauth2) {
    return Promise.resolve()
  }

  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')

      script.src = GOOGLE_IDENTITY_SCRIPT
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => {
        scriptPromise = null
        reject(new Error('google_identity_unavailable'))
      }
      document.head.append(script)
    })
  }

  return scriptPromise
}

// Loads the script ahead of time, so a click can open Google's window immediately.
export function preloadGoogleIdentity() {
  loadGoogleIdentity().catch(() => {})
}

function openTokenPrompt(clientId) {
  return new Promise((resolve, reject) => {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: DRIVE_APPDATA_SCOPE,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error || 'authorization_failed'))
          return
        }

        resolve({
          accessToken: response.access_token,
          expiresAt: Date.now() + Number(response.expires_in ?? 0) * 1000,
        })
      },
      error_callback: (error) => reject(new Error(error?.type || 'authorization_failed')),
    })

    tokenClient.requestAccessToken({ prompt: '' })
  })
}

// Browsers block popups that do not open right after a click, so when the script is
// already loaded the window is opened synchronously, without waiting for anything.
export function requestDriveAccessToken(clientId) {
  if (window.google?.accounts?.oauth2) {
    return openTokenPrompt(clientId)
  }

  return loadGoogleIdentity().then(() => openTokenPrompt(clientId))
}

export function revokeDriveAccessToken(accessToken) {
  window.google?.accounts?.oauth2?.revoke(accessToken, () => {})
}
