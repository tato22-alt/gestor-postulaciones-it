function PersistenceWarning({ message, action }) {
  if (!message) {
    return null
  }

  return (
    <aside className="persistence-warning" role="alert" aria-label="Advertencia de almacenamiento">
      <strong>Advertencia de almacenamiento</strong>
      <p>{message}</p>
      {action && (
        <button className="button button-secondary" type="button" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </aside>
  )
}

export default PersistenceWarning
