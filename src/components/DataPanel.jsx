import { useRef } from 'react'

function DataPanel({ message, onExportBackup, onImportFile, onExportOpportunitiesCsv, onExportApplicationsCsv }) {
  const fileInputRef = useRef(null)

  const handleFileChange = (event) => {
    const [file] = event.target.files

    // Reset the input so choosing the same file again triggers a new import attempt.
    event.target.value = ''

    if (file) {
      onImportFile(file)
    }
  }

  return (
    <section className="panel data-panel" aria-labelledby="data-panel-title">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Respaldo</p>
          <h2 id="data-panel-title">Tus datos</h2>
        </div>
        <p>Guardá una copia, pasala a otro navegador o abrila en una planilla.</p>
      </div>

      <div className="data-panel-actions">
        <button className="button button-primary" type="button" onClick={onExportBackup}>
          Exportar respaldo
        </button>
        <button
          className="button button-secondary"
          type="button"
          onClick={() => fileInputRef.current?.click()}
        >
          Importar respaldo
        </button>
        <input
          ref={fileInputRef}
          className="visually-hidden"
          type="file"
          accept=".json,application/json"
          tabIndex={-1}
          aria-hidden="true"
          onChange={handleFileChange}
        />
        <button className="button button-secondary" type="button" onClick={onExportOpportunitiesCsv}>
          Oportunidades en CSV
        </button>
        <button className="button button-secondary" type="button" onClick={onExportApplicationsCsv}>
          Postulaciones en CSV
        </button>
      </div>

      {/* Both live regions stay mounted; only their content changes, keyed by message id. */}
      <div role="alert">
        {message?.type === 'error' && (
          <p key={message.id} className="data-panel-message data-panel-message--error">
            {message.text}
          </p>
        )}
      </div>
      <div role="status">
        {message?.type === 'info' && (
          <p key={message.id} className="data-panel-message data-panel-message--info">
            {message.text}
          </p>
        )}
      </div>
    </section>
  )
}

export default DataPanel
