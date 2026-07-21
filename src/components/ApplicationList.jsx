import EmptyState from './EmptyState.jsx'
import FiltersBar from './FiltersBar.jsx'

function ApplicationList() {
  return (
    <section className="panel" aria-labelledby="applications-title">
      <div className="list-toolbar">
        <div>
          <p className="section-kicker">Oportunidades</p>
          <h2 id="applications-title">Postulaciones</h2>
          <p className="results-count">0 resultados</p>
        </div>

        <FiltersBar />
      </div>

      <EmptyState />
    </section>
  )
}

export default ApplicationList
