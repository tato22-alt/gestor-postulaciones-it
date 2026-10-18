import {
  APPLICATION_STATUSES,
  EMPLOYMENT_TYPES,
  MODALITIES,
  OPPORTUNITY_STATUSES,
} from '../constants/domainOptions.js'

function MetricBreakdown({ title, description, metrics }) {
  return (
    <article className="dashboard-group">
      <div className="dashboard-group-heading">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      <ul className="metric-list">
        {metrics.map((metric) => (
          <li key={metric.value}>
            <div className="metric-value-row">
              <span>{metric.label}</span>
              <strong>{metric.count}</strong>
            </div>
            {metric.percentage === null ? (
              <span className="metric-percentage">Sin datos</span>
            ) : (
              <>
                <progress
                  aria-label={`${metric.label}: ${metric.percentage}% del total`}
                  max="100"
                  value={metric.percentage}
                />
                <span className="metric-percentage">
                  {metric.percentage}% del total
                </span>
              </>
            )}
          </li>
        ))}
      </ul>
    </article>
  )
}

function mapControlledMetrics(options, metrics) {
  return Object.values(options).map((option) => ({
    value: option.value,
    label: option.label,
    ...metrics[option.value],
  }))
}

function StatsPanel({ metrics, applicationMetrics, dueFollowUpCount }) {
  const applicationStatusMetrics = mapControlledMetrics(
    APPLICATION_STATUSES,
    applicationMetrics.applicationsByStatus,
  )
  const statusMetrics = mapControlledMetrics(
    OPPORTUNITY_STATUSES,
    metrics.opportunitiesByStatus,
  )
  const modalityMetrics = [
    ...mapControlledMetrics(MODALITIES, metrics.modality.values),
    {
      value: 'unspecified',
      label: 'Sin especificar',
      ...metrics.modality.unspecified,
    },
  ]
  const employmentTypeMetrics = [
    ...mapControlledMetrics(EMPLOYMENT_TYPES, metrics.employmentType.values),
    {
      value: 'unspecified',
      label: 'Sin especificar',
      ...metrics.employmentType.unspecified,
    },
  ]
  const publicationDateMetrics = [
    {
      value: 'with_date',
      label: 'Con fecha',
      ...metrics.publicationDate.withDate,
    },
    {
      value: 'without_date',
      label: 'Sin fecha',
      ...metrics.publicationDate.withoutDate,
    },
  ]

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
          <p>Total de oportunidades</p>
          <strong>{metrics.totalOpportunities}</strong>
        </article>
        <article className="stat-card">
          <p>Oportunidades detectadas</p>
          <strong>{metrics.detectedOpportunities}</strong>
        </article>
        <article className="stat-card">
          <p>Agregadas esta semana</p>
          <strong>{metrics.opportunitiesAddedThisWeek}</strong>
          <span>Desde el lunes</span>
        </article>
        <article className="stat-card">
          <p>Con fecha de publicación</p>
          <strong>{metrics.publicationDate.withDate.count}</strong>
        </article>
      </div>

      <div className="dashboard-groups">
        <MetricBreakdown
          title="Estados de oportunidades"
          description="Distribución según el estado real de cada oportunidad."
          metrics={statusMetrics}
        />
        <MetricBreakdown
          title="Fecha de publicación"
          description="Cobertura de la fecha informada por la oferta."
          metrics={publicationDateMetrics}
        />
        <MetricBreakdown
          title="Modalidades"
          description="Modalidad registrada para las oportunidades actuales."
          metrics={modalityMetrics}
        />
        <MetricBreakdown
          title="Tipos de jornada"
          description="Jornada registrada para las oportunidades actuales."
          metrics={employmentTypeMetrics}
        />
        <MetricBreakdown
          title="Estados de postulaciones"
          description={`${applicationMetrics.activeApplications} en curso de ${applicationMetrics.totalApplications} registradas · ${dueFollowUpCount} ${dueFollowUpCount === 1 ? 'seguimiento vencido o para hoy' : 'seguimientos vencidos o para hoy'}. Oferta y Rechazado son estados finales.`}
          metrics={applicationStatusMetrics}
        />

        <article className="dashboard-group dashboard-group-wide">
          <div className="dashboard-group-heading">
            <h3>Procesos todavía no disponibles</h3>
            <p>
              Esta métrica necesita un flujo que aún no fue implementado y no se calcula a
              partir de oportunidades ni de postulaciones.
            </p>
          </div>
          <dl className="unsupported-metrics">
            <div>
              <dt>Recomendaciones</dt>
              <dd>No implementado</dd>
            </div>
          </dl>
        </article>
      </div>
    </section>
  )
}

export default StatsPanel
