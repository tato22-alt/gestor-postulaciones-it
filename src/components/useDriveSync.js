import { useEffect, useRef, useState } from 'react'
import mergeSnapshots from '../application/mergeSnapshots.js'
import synchronizeData from '../application/synchronizeData.js'
import { createBackupText, parseBackupText } from '../infrastructure/backupFile.js'
import { isDriveSyncEnabled, setDriveSyncEnabled } from '../infrastructure/driveSyncSettings.js'
import { createDriveAppDataClient } from '../infrastructure/googleDriveAppData.js'
import {
  preloadGoogleIdentity,
  requestDriveAccessToken,
  revokeDriveAccessToken,
} from '../infrastructure/googleIdentity.js'

const AUTO_SYNC_DELAY_MS = 3000
// After uploading, read the copy once more a little later: if another device uploaded at
// the same moment, its changes are picked up instead of waiting for the next local edit.
const VERIFY_SYNC_DELAY_MS = 10000
const SNAPSHOT_COLLECTIONS = ['opportunities', 'applications', 'sources', 'deletions', 'profile', 'preferences']

// The snapshot object is rebuilt on every render, so changes are detected per collection.
const hasSnapshotChanged = (previous, next) =>
  SNAPSHOT_COLLECTIONS.some((collection) => previous[collection] !== next[collection])
// Renew a little before Google's expiry so a request never starts with an expiring token.
const TOKEN_SAFETY_MARGIN_MS = 60 * 1000

export const DRIVE_SYNC_STATUS = Object.freeze({
  DISCONNECTED: 'disconnected',
  NEEDS_AUTHORIZATION: 'needs_authorization',
  SYNCING: 'syncing',
  SYNCED: 'synced',
  ERROR: 'error',
})

/**
 * Coordinates synchronization with the user's own Google Drive. It owns the connection
 * state, the in-memory access token, and the timing (after changes, when the tab becomes
 * visible). Merging and file handling live in the application and infrastructure layers.
 */
export default function useDriveSync({
  clientId,
  storage,
  snapshot,
  isStorageBlocked,
  applyMergedSnapshot,
}) {
  const [syncState, setSyncState] = useState(() => ({
    status:
      clientId && isDriveSyncEnabled(storage)
        ? DRIVE_SYNC_STATUS.NEEDS_AUTHORIZATION
        : DRIVE_SYNC_STATUS.DISCONNECTED,
    lastSyncedAt: null,
    error: null,
    announce: false,
  }))
  const tokenRef = useRef(null)
  const snapshotRef = useRef(snapshot)
  const inFlightRef = useRef(false)
  const rerunRef = useRef(false)
  const appliedFromSyncRef = useRef(false)
  const runSyncRef = useRef(null)
  const verifyTimerRef = useRef(null)

  snapshotRef.current = snapshot

  const hasValidToken = () =>
    tokenRef.current !== null && tokenRef.current.expiresAt - TOKEN_SAFETY_MARGIN_MS > Date.now()

  const runSync = async ({ interactive }) => {
    if (!clientId) return

    // Only results of an action the user started are announced to screen readers.
    const announce = interactive

    if (isStorageBlocked()) {
      setSyncState((current) => ({ ...current, status: DRIVE_SYNC_STATUS.ERROR, error: 'storage_blocked', announce }))
      return
    }

    if (inFlightRef.current) {
      rerunRef.current = true
      return
    }

    if (!hasValidToken()) {
      if (!interactive) {
        setSyncState((current) => ({ ...current, status: DRIVE_SYNC_STATUS.NEEDS_AUTHORIZATION, announce }))
        return
      }

      try {
        tokenRef.current = await requestDriveAccessToken(clientId)
      } catch (error) {
        const errorCode = error?.message === 'popup_failed_to_open' ? 'popup_blocked' : 'authorization'
        setSyncState((current) => ({ ...current, status: DRIVE_SYNC_STATUS.ERROR, error: errorCode, announce }))
        return
      }
    }

    inFlightRef.current = true
    setSyncState((current) => ({ ...current, status: DRIVE_SYNC_STATUS.SYNCING, error: null, announce }))

    const startSnapshot = snapshotRef.current

    try {
      const result = await synchronizeData({
        local: startSnapshot,
        remoteStore: createDriveAppDataClient({ accessToken: tokenRef.current.accessToken }),
        parseSnapshot: parseBackupText,
        serializeSnapshot: (merged) => createBackupText(merged),
      })

      if (!result.ok) {
        setSyncState((current) => ({ ...current, status: DRIVE_SYNC_STATUS.ERROR, error: result.status, announce }))
        return
      }

      // The user may have changed data while the request was running: merge those edits
      // again instead of overwriting them, and synchronize once more afterwards.
      const changedMeanwhile = hasSnapshotChanged(startSnapshot, snapshotRef.current)
      const finalSnapshot = changedMeanwhile
        ? mergeSnapshots(snapshotRef.current, result.merged)
        : result.merged

      if (changedMeanwhile) {
        rerunRef.current = true
      }

      if (changedMeanwhile ? finalSnapshot.changedLocal : result.changedLocal) {
        appliedFromSyncRef.current = true
        applyMergedSnapshot(finalSnapshot)
      }

      if (result.uploaded) {
        clearTimeout(verifyTimerRef.current)
        verifyTimerRef.current = setTimeout(
          () => runSyncRef.current?.({ interactive: false }),
          VERIFY_SYNC_DELAY_MS,
        )
      }

      setSyncState({ status: DRIVE_SYNC_STATUS.SYNCED, lastSyncedAt: new Date(), error: null, announce })
    } catch (error) {
      if (error?.status === 'unauthorized') {
        tokenRef.current = null
        setSyncState((current) => ({ ...current, status: DRIVE_SYNC_STATUS.NEEDS_AUTHORIZATION, announce }))
      } else {
        const errorCode = error?.status === 'forbidden' ? 'forbidden' : 'network'
        setSyncState((current) => ({ ...current, status: DRIVE_SYNC_STATUS.ERROR, error: errorCode, announce }))
      }
    } finally {
      inFlightRef.current = false

      if (rerunRef.current) {
        rerunRef.current = false
        setTimeout(() => runSyncRef.current?.({ interactive: false }), 0)
      }
    }
  }

  runSyncRef.current = runSync

  const isEnabled = syncState.status !== DRIVE_SYNC_STATUS.DISCONNECTED

  // After local changes, synchronize automatically once the user pauses for a moment.
  useEffect(() => {
    if (appliedFromSyncRef.current) {
      appliedFromSyncRef.current = false
      return undefined
    }

    if (!isEnabled || !hasValidToken()) return undefined

    const timer = setTimeout(() => runSyncRef.current?.({ interactive: false }), AUTO_SYNC_DELAY_MS)
    return () => clearTimeout(timer)
    // hasValidToken reads a ref; the effect intentionally reacts only to data changes.
  }, [snapshot.opportunities, snapshot.applications, snapshot.sources, snapshot.deletions, snapshot.profile, snapshot.preferences, isEnabled])

  // Coming back to the tab picks up changes made on other devices.
  useEffect(() => {
    if (!isEnabled) return undefined

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && hasValidToken()) {
        runSyncRef.current?.({ interactive: false })
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [isEnabled])

  useEffect(() => () => clearTimeout(verifyTimerRef.current), [])

  useEffect(() => {
    if (clientId) preloadGoogleIdentity()
  }, [clientId])

  const connect = () => {
    setDriveSyncEnabled(storage, true)
    runSync({ interactive: true })
  }

  const syncNow = () => runSync({ interactive: true })

  const disconnect = () => {
    if (tokenRef.current) {
      revokeDriveAccessToken(tokenRef.current.accessToken)
    }

    clearTimeout(verifyTimerRef.current)
    tokenRef.current = null
    setDriveSyncEnabled(storage, false)
    setSyncState({ status: DRIVE_SYNC_STATUS.DISCONNECTED, lastSyncedAt: null, error: null, announce: true })
  }

  return { ...syncState, isAvailable: Boolean(clientId), connect, syncNow, disconnect }
}
