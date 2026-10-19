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

      {message && (
        <p
          className={`data-panel-message data-panel-message--${message.type}`}
          role={message.type === 'error' ? 'alert' : 'status'}
        >
          {message.text}
        </p>
      )}
    </section>
  )
}

export default DataPanel
