import { DRIVE_SYNC_STATUS } from './useDriveSync.js'

const ERROR_MESSAGES = {
  authorization: 'No se pudo conectar con Google. Probá de nuevo.',
  popup_blocked:
    'El navegador bloqueó la ventana de Google. Permití las ventanas emergentes para este sitio y volvé a intentar.',
  forbidden:
    'Google Drive rechazó la operación, por ejemplo por límite de uso o falta de espacio. Probá más tarde.',
  network: 'No se pudo sincronizar: revisá tu conexión e intentá de nuevo.',
  remote_invalid:
    'La copia guardada en tu Google Drive no es válida, así que no se modificó. Tus datos en este dispositivo siguen intactos.',
  storage_blocked:
    'No se puede sincronizar mientras haya datos guardados en este navegador que no se puedan leer.',
}

function formatTime(date) {
  return new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit' }).format(date)
}

function SyncPanel({ sync }) {
  if (!sync.isAvailable) {
    return null
  }

  const isSyncing = sync.status === DRIVE_SYNC_STATUS.SYNCING
  const isConnected = sync.status !== DRIVE_SYNC_STATUS.DISCONNECTED
  const statusText = {
    [DRIVE_SYNC_STATUS.DISCONNECTED]:
      'Conectá tu Google Drive para tener tus datos en todos tus dispositivos. La app solo usa una carpeta privada propia: no puede ver tus otros archivos.',
    [DRIVE_SYNC_STATUS.NEEDS_AUTHORIZATION]: 'Google Drive conectado. Tocá «Sincronizar» para actualizar tus datos.',
    [DRIVE_SYNC_STATUS.SYNCING]: 'Sincronizando…',
    [DRIVE_SYNC_STATUS.SYNCED]: sync.lastSyncedAt
      ? `Sincronizado a las ${formatTime(sync.lastSyncedAt)}.`
      : 'Sincronizado.',
    [DRIVE_SYNC_STATUS.ERROR]: ERROR_MESSAGES[sync.error] ?? ERROR_MESSAGES.network,
  }[sync.status]
  const isError = sync.status === DRIVE_SYNC_STATUS.ERROR

  return (
    <section className="panel sync-panel" aria-labelledby="sync-panel-title">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Sincronización</p>
          <h2 id="sync-panel-title">Google Drive</h2>
        </div>
      </div>

      <p className={`sync-status sync-status--${sync.status}`}>{statusText}</p>
      {!isConnected && (
        <p className="sync-privacy-link">
          <a href="privacidad.html">Cómo se cuidan tus datos</a>
        </p>
      )}

      {/* Live regions stay mounted so screen readers announce their changes. Automatic
          background syncs only update the visible text, so they do not interrupt. */}
      <p className="visually-hidden" role="alert">
        {isError ? statusText : ''}
      </p>
      <p className="visually-hidden" role="status">
        {sync.announce && !isError ? statusText : ''}
      </p>

      <div className="data-panel-actions">
        {isConnected ? (
          <>
            <button className="button button-primary" type="button" onClick={sync.syncNow} disabled={isSyncing}>
              {sync.status === DRIVE_SYNC_STATUS.SYNCED ? 'Sincronizar ahora' : 'Sincronizar'}
            </button>
            <button className="button button-secondary" type="button" onClick={sync.disconnect} disabled={isSyncing}>
              Desconectar
            </button>
          </>
        ) : (
          <button className="button button-primary" type="button" onClick={sync.connect}>
            Conectar Google Drive
          </button>
        )}
      </div>
    </section>
  )
}

export default SyncPanel
