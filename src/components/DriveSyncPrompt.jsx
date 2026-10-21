function DriveSyncPrompt({ onConnect, onDismiss }) {
  return (
    <aside className="drive-sync-prompt" aria-labelledby="drive-sync-prompt-title">
      <div className="drive-sync-prompt-text">
        <h2 id="drive-sync-prompt-title">Usá tus datos en todos tus dispositivos</h2>
        <p>
          Conectá tu Google Drive y tus oportunidades se sincronizan entre la computadora y el
          celular. La app solo usa una carpeta privada propia de tu cuenta.{' '}
          <a href="privacidad.html">Cómo se cuidan tus datos</a>
        </p>
      </div>
      <div className="drive-sync-prompt-actions">
        <button className="button button-primary" type="button" onClick={onConnect}>
          Conectar Google Drive
        </button>
        <button className="button button-secondary" type="button" onClick={onDismiss}>
          Ahora no
        </button>
      </div>
    </aside>
  )
}

export default DriveSyncPrompt
