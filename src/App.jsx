import './App.css'

function App() {
  return (
    <div className="app-shell">
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

      <main className="app-main">
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

        <section className="panel follow-up-panel" aria-labelledby="follow-ups-title">
          <div>
            <p className="section-kicker">Agenda</p>
            <h2 id="follow-ups-title">Próximos seguimientos</h2>
          </div>
          <p className="muted-message">No tenés seguimientos pendientes.</p>
        </section>

        <section className="panel" aria-labelledby="form-title">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Nueva oportunidad</p>
              <h2 id="form-title">Datos de la postulación</h2>
            </div>
            <p>Registrá la información principal del proceso.</p>
          </div>

          <form className="application-form">
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="company">Empresa</label>
                <input id="company" name="company" type="text" placeholder="Ej.: Empresa tecnológica" />
              </div>

              <div className="form-field">
                <label htmlFor="position">Puesto</label>
                <input id="position" name="position" type="text" placeholder="Ej.: Desarrollador trainee" />
              </div>

              <div className="form-field form-field-wide">
                <label htmlFor="job-link">Enlace a la publicación</label>
                <input id="job-link" name="jobLink" type="url" placeholder="https://" />
              </div>

              <div className="form-field">
                <label htmlFor="application-date">Fecha de postulación</label>
                <input id="application-date" name="applicationDate" type="date" />
              </div>

              <div className="form-field">
                <label htmlFor="status">Estado</label>
                <select id="status" name="status" defaultValue="">
                  <option value="" disabled>Seleccioná un estado</option>
                  <option value="guardada">Guardada</option>
                  <option value="postulado">Postulado</option>
                  <option value="entrevista">Entrevista</option>
                  <option value="prueba-tecnica">Prueba técnica</option>
                  <option value="rechazado">Rechazado</option>
                  <option value="oferta">Oferta</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="work-mode">Modalidad</label>
                <select id="work-mode" name="workMode" defaultValue="">
                  <option value="" disabled>Seleccioná una modalidad</option>
                  <option value="presencial">Presencial</option>
                  <option value="hibrida">Híbrida</option>
                  <option value="remota">Remota</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="source">Fuente</label>
                <input id="source" name="source" type="text" placeholder="Ej.: LinkedIn" />
              </div>

              <div className="form-field">
                <label htmlFor="follow-up-date">Fecha de seguimiento</label>
                <input id="follow-up-date" name="followUpDate" type="date" />
              </div>

              <div className="form-field">
                <label htmlFor="next-action">Próxima acción</label>
                <input id="next-action" name="nextAction" type="text" placeholder="Ej.: Enviar correo" />
              </div>

              <div className="form-field form-field-wide">
                <label htmlFor="notes">Notas</label>
                <textarea id="notes" name="notes" rows="4" placeholder="Información relevante sobre el proceso" />
              </div>
            </div>

            <div className="form-actions">
              <button className="button button-primary" type="button">
                Guardar postulación
              </button>
              <button className="button button-secondary" type="button">
                Cancelar
              </button>
            </div>
          </form>
        </section>

        <section className="panel" aria-labelledby="applications-title">
          <div className="list-toolbar">
            <div>
              <p className="section-kicker">Oportunidades</p>
              <h2 id="applications-title">Postulaciones</h2>
              <p className="results-count">0 resultados</p>
            </div>

            <div className="filters" aria-label="Búsqueda y filtros">
              <div className="form-field search-field">
                <label htmlFor="search">Buscar</label>
                <input id="search" name="search" type="search" placeholder="Buscar por empresa o puesto" />
              </div>
              <div className="form-field filter-field">
                <label htmlFor="status-filter">Estado</label>
                <select id="status-filter" name="statusFilter" defaultValue="all">
                  <option value="all">Todos los estados</option>
                </select>
              </div>
            </div>
          </div>

          <div className="empty-state">
            <h3>Todavía no registraste postulaciones.</h3>
            <p>Cuando guardes una oportunidad laboral, aparecerá en esta sección.</p>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
