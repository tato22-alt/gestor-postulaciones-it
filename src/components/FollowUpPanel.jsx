import { FOLLOW_UP_URGENCY } from '../domain/followUpPolicy.js'
import { formatDateString } from '../utils/date.js'

const URGENCY_LABELS = {
  [FOLLOW_UP_URGENCY.OVERDUE]: 'Vencido',
  [FOLLOW_UP_URGENCY.TODAY]: 'Hoy',
  [FOLLOW_UP_URGENCY.UPCOMING]: 'Próximo',
}

function FollowUpPanel({ followUps, onComplete, headingRef }) {
  return (
    <section
      className={`panel follow-up-panel${followUps.length > 0 ? ' follow-up-panel--with-list' : ''}`}
      aria-labelledby="follow-ups-title"
    >
      <div>
        <p className="section-kicker">Agenda</p>
        <h2 id="follow-ups-title" ref={headingRef} tabIndex={-1}>
          Próximos seguimientos
        </h2>
      </div>

      {followUps.length === 0 ? (
        <p className="muted-message">No tenés seguimientos pendientes.</p>
      ) : (
        <ul className="follow-up-list">
          {followUps.map(({ application, opportunity, followUpAt, urgency }) => {
            const accessibleName = opportunity
              ? `${opportunity.title} en ${opportunity.company}`
              : 'oportunidad no disponible'

            return (
              <li key={application.id} className="follow-up-item">
                <div className="follow-up-item-content">
                  <p className="follow-up-item-date">
                    <span className={`follow-up-urgency follow-up-urgency--${urgency}`}>
                      {URGENCY_LABELS[urgency]}
                    </span>
                    {formatDateString(followUpAt)}
                  </p>
                  <p className="follow-up-item-title">
                    {opportunity
                      ? `${opportunity.title} · ${opportunity.company}`
                      : 'Oportunidad no disponible'}
                  </p>
                  {application.nextAction && (
                    <p className="follow-up-item-action">{application.nextAction}</p>
                  )}
                </div>
                <button
                  className="button button-secondary"
                  type="button"
                  aria-label={`Marcar seguimiento como hecho: ${accessibleName}`}
                  onClick={() => onComplete(application)}
                >
                  Marcar como hecho
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default FollowUpPanel
