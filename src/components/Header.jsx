function Header() {
  return (
    <header className="app-header">
      <div className="header-content">
        <div>
          <p className="eyebrow">Seguimiento laboral</p>
          <h1>Gestor de Postulaciones IT</h1>
          <p className="header-description">
            Organizá tus búsquedas laborales y no pierdas ningún seguimiento.
          </p>
        </div>
        <button className="button button-primary" type="button">
          Nueva postulación
        </button>
      </div>
    </header>
  )
}

export default Header
