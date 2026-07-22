function Header() {
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
          <button className="button button-primary" type="button">
            Agregar oportunidad
          </button>
          <button className="button button-secondary" type="button">
            Registrar postulación
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
