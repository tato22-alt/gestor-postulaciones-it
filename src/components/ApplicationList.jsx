import EmptyState from './EmptyState.jsx'

function ApplicationList() {
  return (
    <section className="panel" aria-labelledby="applications-title">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Procesos</p>
          <h2 id="applications-title">Postulaciones activas</h2>
        </div>
        <p>Procesos en los que ya enviaste tu solicitud.</p>
      </div>

      <EmptyState />
    </section>
  )
}

export default ApplicationList
