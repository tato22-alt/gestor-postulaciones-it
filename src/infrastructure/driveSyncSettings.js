// Remembers only whether the user chose to synchronize with Google Drive on this device.
// Access tokens are never stored.
const DRIVE_SYNC_SETTING_KEY = 'it-job-search-assistant.drive-sync'

export function isDriveSyncEnabled(storage) {
  try {
    return storage?.getItem(DRIVE_SYNC_SETTING_KEY) === 'enabled'
  } catch {
    return false
  }
}

export function setDriveSyncEnabled(storage, enabled) {
  try {
    if (enabled) {
      storage?.setItem(DRIVE_SYNC_SETTING_KEY, 'enabled')
    } else {
      storage?.removeItem(DRIVE_SYNC_SETTING_KEY)
    }
  } catch {
    // The preference is a convenience: if it cannot be saved, the user connects again.
  }
}
