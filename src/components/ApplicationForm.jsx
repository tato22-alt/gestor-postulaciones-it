function ApplicationForm() {
  return (
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
  )
}

export default ApplicationForm
