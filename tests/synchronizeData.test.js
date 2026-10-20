import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import synchronizeData from '../src/application/synchronizeData.js'
import { createBackupText, parseBackupText } from '../src/infrastructure/backupFile.js'
import { DriveRequestError, createDriveAppDataClient } from '../src/infrastructure/googleDriveAppData.js'
import { createApplication, createOpportunity } from './helpers.js'

const empty = () => ({ opportunities: [], applications: [], sources: [], deletions: [] })
const serializeSnapshot = (snapshot) => createBackupText({ ...snapshot, now: '2026-01-10T12:00:00.000Z' })

// In-memory stand-in for the Drive appDataFolder, speaking the same HTTP API.
function createFakeDrive() {
  const files = new Map()
  const calls = []
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url, method: options.method ?? 'GET', auth: options.headers?.Authorization })
    const parsed = new URL(url)

    if (parsed.pathname === '/drive/v3/files' && !options.method) {
      return Response.json({ files: [...files.keys()].map((id) => ({ id })) })
    }

    if (parsed.pathname.startsWith('/drive/v3/files/') && parsed.searchParams.get('alt') === 'media') {
      return new Response(files.get(decodeURIComponent(parsed.pathname.split('/').pop())))
    }

    if (parsed.pathname === '/upload/drive/v3/files' && options.method === 'POST') {
      const content = options.body.split('\r\n\r\n')[2].split('\r\n--')[0]
      files.set('file-1', content)
      return Response.json({ id: 'file-1' })
    }

    if (parsed.pathname.startsWith('/upload/drive/v3/files/') && options.method === 'PATCH') {
      files.set(decodeURIComponent(parsed.pathname.split('/').pop()), options.body)
      return Response.json({})
    }

    return new Response('not found', { status: 404 })
  }

  return { files, calls, fetchImpl }
}

const sync = (local, drive) =>
  synchronizeData({
    local,
    remoteStore: createDriveAppDataClient({ accessToken: 'token', fetchImpl: drive.fetchImpl }),
    parseSnapshot: parseBackupText,
    serializeSnapshot,
  })

describe('synchronizeData with a simulated Drive', () => {
  it('creates the remote file on the first synchronization', async () => {
    const drive = createFakeDrive()
    const result = await sync({ ...empty(), opportunities: [createOpportunity()] }, drive)

    assert.equal(result.ok, true)
    assert.equal(result.uploaded, true)
    assert.equal(result.changedLocal, false)
    assert.equal(parseBackupText(drive.files.get('file-1')).opportunities.length, 1)
    assert.ok(drive.calls.every((call) => call.auth === 'Bearer token'))
    assert.ok(drive.calls.some((call) => call.url.includes('spaces=appDataFolder')))
  })

  it('brings data from another device and uploads nothing when already up to date', async () => {
    const drive = createFakeDrive()

    await sync({ ...empty(), opportunities: [createOpportunity({ id: 'from-laptop' })] }, drive)

    const phone = await sync(empty(), drive)

    assert.equal(phone.changedLocal, true)
    assert.equal(phone.uploaded, false)
    assert.deepEqual(phone.merged.opportunities.map((o) => o.id), ['from-laptop'])
  })

  it('propagates a deletion to the other device', async () => {
    const drive = createFakeDrive()
    const opportunity = createOpportunity({ id: 'o' })

    await sync({ ...empty(), opportunities: [opportunity] }, drive)
    await sync({ ...empty(), deletions: [{ collection: 'opportunities', id: 'o', deletedAt: '2026-02-01T00:00:00.000Z' }] }, drive)

    const other = await sync({ ...empty(), opportunities: [opportunity] }, drive)

    assert.deepEqual(other.merged.opportunities, [])
  })

  it('never overwrites an invalid remote file', async () => {
    const drive = createFakeDrive()

    drive.files.set('file-1', '{corrupted')

    const result = await sync({ ...empty(), applications: [createApplication()] }, drive)

    assert.deepEqual(result, { ok: false, status: 'remote_invalid' })
    assert.equal(drive.files.get('file-1'), '{corrupted')
  })

  it('reports expired authorization and network failures', async () => {
    const unauthorized = createDriveAppDataClient({ accessToken: 't', fetchImpl: async () => new Response('', { status: 401 }) })
    const offline = createDriveAppDataClient({ accessToken: 't', fetchImpl: async () => { throw new TypeError('offline') } })

    await assert.rejects(unauthorized.readSyncFile(), (error) => error instanceof DriveRequestError && error.status === 'unauthorized')
    await assert.rejects(offline.readSyncFile(), (error) => error.status === 'network')
  })

  it('distinguishes a refused request from an expired authorization', async () => {
    const refused = createDriveAppDataClient({ accessToken: 't', fetchImpl: async () => new Response('', { status: 403 }) })

    await assert.rejects(refused.readSyncFile(), (error) => error.status === 'forbidden')
  })
})
