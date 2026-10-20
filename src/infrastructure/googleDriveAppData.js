// Google Drive adapter limited to the app's hidden "appDataFolder": the app can only see
// the file it created there, never the user's other Drive files.
export const SYNC_FILE_NAME = 'gestor-postulaciones-it.json'

const FILES_URL = 'https://www.googleapis.com/drive/v3/files'
const UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files'

export class DriveRequestError extends Error {
  constructor(status) {
    super(`Drive request failed: ${status}`)
    this.status = status
  }
}

export function createDriveAppDataClient({ accessToken, fetchImpl = globalThis.fetch.bind(globalThis) }) {
  const request = async (url, options = {}) => {
    let response

    try {
      response = await fetchImpl(url, {
        ...options,
        headers: { ...options.headers, Authorization: `Bearer ${accessToken}` },
      })
    } catch {
      throw new DriveRequestError('network')
    }

    if (response.status === 401) {
      throw new DriveRequestError('unauthorized')
    }

    // Quota, rate limits, or a full Drive: a new token would not help.
    if (response.status === 403) {
      throw new DriveRequestError('forbidden')
    }

    if (!response.ok) {
      throw new DriveRequestError('http_error')
    }

    return response
  }

  return {
    async readSyncFile() {
      const query = new URLSearchParams({
        spaces: 'appDataFolder',
        q: `name = '${SYNC_FILE_NAME}' and trashed = false`,
        fields: 'files(id)',
        orderBy: 'modifiedTime desc',
        pageSize: '1',
      })
      const list = await (await request(`${FILES_URL}?${query}`)).json()
      const fileId = list?.files?.[0]?.id ?? null

      if (!fileId) {
        return { fileId: null, text: null }
      }

      const text = await (await request(`${FILES_URL}/${encodeURIComponent(fileId)}?alt=media`)).text()

      return { fileId, text }
    },

    async writeSyncFile(fileId, text) {
      if (fileId) {
        await request(`${UPLOAD_URL}/${encodeURIComponent(fileId)}?uploadType=media`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: text,
        })
        return fileId
      }

      const boundary = `gestor-postulaciones-${crypto.randomUUID()}`
      const metadata = JSON.stringify({ name: SYNC_FILE_NAME, parents: ['appDataFolder'] })
      const body =
        `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n` +
        `--${boundary}\r\nContent-Type: application/json\r\n\r\n${text}\r\n--${boundary}--`
      const created = await (
        await request(`${UPLOAD_URL}?uploadType=multipart&fields=id`, {
          method: 'POST',
          headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
          body,
        })
      ).json()

      return created.id
    },
  }
}
