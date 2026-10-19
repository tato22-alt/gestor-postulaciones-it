import { useEffect, useRef } from 'react'
import SourceForm from './SourceForm.jsx'

function SourceCard({
  source,
  opportunityCount,
  isEditing,
  isEditDisabled,
  editWarning,
  onEdit,
  onCancelEdit,
  onSubmitEdit,
  onRequestDelete,
  onAddOpportunity,
}) {
  const editButtonRef = useRef(null)
  const wasEditingRef = useRef(isEditing)

  // When the inline form closes, return focus to the button that opened it.
  useEffect(() => {
    if (wasEditingRef.current && !isEditing) {
      editButtonRef.current?.focus()
    }

    wasEditingRef.current = isEditing
  }, [isEditing])

  return (
    <article className="opportunity-card">
      <div className="opportunity-card-header">
        <div>
          <p className="opportunity-company">Fuente de empleo</p>
          <h3>{source.companyName}</h3>
        </div>
        <span className="source-count">
          {opportunityCount === 1 ? '1 oportunidad' : `${opportunityCount} oportunidades`}
        </span>
      </div>

      {isEditing ? (
        <SourceForm
          key={source.id}
          initialValues={source}
          submitLabel="Guardar cambios"
          submissionWarning={editWarning}
          onSubmit={onSubmitEdit}
          onCancel={onCancelEdit}
          autoFocus
        />
      ) : (
        <>
          <div className="opportunity-card-actions">
            <a
              className="button button-secondary opportunity-link"
              href={source.careersUrl}
              target="_blank"
              rel="noreferrer"
            >
              Abrir página de empleo
            </a>
            <button
              className="button button-primary"
              type="button"
              aria-label={`Agregar oportunidad de ${source.companyName}`}
              onClick={() => onAddOpportunity(source)}
            >
              Agregar oportunidad
            </button>
            <button
              ref={editButtonRef}
              className="button button-secondary"
              type="button"
              disabled={isEditDisabled}
              aria-label={`Editar fuente: ${source.companyName}`}
              onClick={() => onEdit(source)}
            >
              Editar
            </button>
          </div>
          <div className="opportunity-delete-action">
            {opportunityCount > 0 ? (
              <p className="opportunity-delete-blocked">
                No se puede eliminar porque tiene oportunidades asociadas.
              </p>
            ) : (
              <button
                className="button button-danger-outline"
                type="button"
                aria-label={`Eliminar fuente: ${source.companyName}`}
                onClick={() => onRequestDelete(source)}
              >
                Eliminar
              </button>
            )}
          </div>
        </>
      )}
    </article>
  )
}

function SourcesPanel({
  sources,
  opportunities,
  editingSourceId,
  editWarning,
  onCreate,
  onEdit,
  onCancelEdit,
  onSubmitEdit,
  onRequestDelete,
  onAddOpportunity,
}) {
  const opportunityCountBySource = new Map()

  for (const opportunity of opportunities) {
    if (opportunity.sourceId) {
      opportunityCountBySource.set(
        opportunity.sourceId,
        (opportunityCountBySource.get(opportunity.sourceId) ?? 0) + 1,
      )
    }
  }

  return (
    <section className="panel" aria-labelledby="sources-title">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Empresas</p>
          <h2 id="sources-title">Fuentes de empleo</h2>
        </div>
        <p>Guardá las páginas de empleo oficiales de las empresas que seguís.</p>
      </div>

      <SourceForm submitLabel="Agregar fuente" onSubmit={onCreate} />

      {sources.length === 0 ? (
        <div className="empty-state compact-empty-state">
          <h3>Todavía no agregaste fuentes.</h3>
          <p>Agregá la página de empleo de una empresa para volver a ella y cargar sus ofertas.</p>
        </div>
      ) : (
        <div className="opportunity-list source-list">
          {sources.map((source) => (
            <SourceCard
              key={source.id}
              source={source}
              opportunityCount={opportunityCountBySource.get(source.id) ?? 0}
              isEditing={editingSourceId === source.id}
              isEditDisabled={editingSourceId !== null}
              editWarning={editWarning}
              onEdit={onEdit}
              onCancelEdit={onCancelEdit}
              onSubmitEdit={onSubmitEdit}
              onRequestDelete={onRequestDelete}
              onAddOpportunity={onAddOpportunity}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default SourcesPanel
