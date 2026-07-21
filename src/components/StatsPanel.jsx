function StatsPanel() {
  return (
    <section aria-labelledby="statistics-title">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Resumen</p>
          <h2 id="statistics-title">Estado de tu búsqueda</h2>
        </div>
      </div>

      <div className="statistics-grid">
        <article className="stat-card">
          <p>Total</p>
          <strong>0</strong>
        </article>
        <article className="stat-card">
          <p>Activas</p>
          <strong>0</strong>
        </article>
        <article className="stat-card">
          <p>Procesos avanzados</p>
          <strong>0</strong>
        </article>
        <article className="stat-card">
          <p>Ofertas</p>
          <strong>0</strong>
        </article>
      </div>
    </section>
  )
}

export default StatsPanel
