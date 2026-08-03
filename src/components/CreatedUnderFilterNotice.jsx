function CreatedUnderFilterNotice({ isVisible, onResetFilters }) {
  if (!isVisible) {
    return null
  }

  return (
    <div className="created-under-filter-notice" role="status" aria-live="polite">
      <p>
        La oportunidad se guardó, pero no se muestra con la búsqueda o el filtro de estado
        actuales.
      </p>
      <button
        className="button button-secondary"
        type="button"
        onClick={onResetFilters}
      >
        Restablecer filtros
      </button>
    </div>
  )
}

export default CreatedUnderFilterNotice
