import mergeSnapshots from './mergeSnapshots.js'

/**
 * One synchronization round: read the remote copy, merge it with this device's data, and
 * upload the result when the remote copy is missing or outdated. Parsing and serialization
 * are injected so this coordinator stays independent of the file format and of Google.
 *
 * A remote copy that cannot be validated is never overwritten.
 */
export default async function synchronizeData({ local, remoteStore, parseSnapshot, serializeSnapshot }) {
  const { fileId, text } = await remoteStore.readSyncFile()
  let remote = { opportunities: [], applications: [], sources: [], deletions: [], profile: null }

  if (text !== null) {
    const parsed = parseSnapshot(text)

    if (!parsed.ok) {
      return { ok: false, status: 'remote_invalid' }
    }

    remote = parsed
  }

  const merged = mergeSnapshots(local, remote)
  const mustUpload = text === null || merged.changedRemote

  if (mustUpload) {
    await remoteStore.writeSyncFile(fileId, serializeSnapshot(merged))
  }

  return {
    ok: true,
    status: 'synchronized',
    merged,
    changedLocal: merged.changedLocal,
    uploaded: mustUpload,
  }
}
