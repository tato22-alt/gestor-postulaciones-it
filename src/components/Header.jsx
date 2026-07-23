function Header({ onAddOpportunity }) {
  return (
    <header className="app-header">
      <div className="header-content">
        <div>
          <p className="eyebrow">Seguimiento laboral</p>
          <h1>Gestor de Postulaciones IT</h1>
          <p className="header-description">
            Encontrá oportunidades compatibles, decidí dónde postularte y seguí cada proceso laboral.
          </p>
        </div>
        <div className="header-actions">
          <button className="button button-primary" type="button" onClick={onAddOpportunity}>
            Agregar oportunidad
          </button>
          <button
            className="button button-secondary"
            type="button"
            title="Disponible en una etapa posterior"
            disabled
          >
            Registrar postulación
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
