function Header({ onAddOpportunity, addOpportunityButtonRef }) {
  return (
    <header className="app-header">
      <div className="header-content">
        <div>
          <p className="eyebrow">Seguimiento laboral</p>
          <h1>Gestor de Postulaciones IT</h1>
          <p className="header-description">
            Encontrá oportunidades compatibles, decidí dónde postularte y seguí cada proceso laboral.
          </p>
          <p className="header-privacy">
            Tus datos se guardan en este navegador y, si lo conectás, en tu propio Google Drive.{' '}
            <a href="privacidad.html">Privacidad</a>
          </p>
        </div>
        <div className="header-actions">
          <button
            ref={addOpportunityButtonRef}
            className="button button-primary"
            type="button"
            onClick={onAddOpportunity}
          >
            Agregar oportunidad
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
