function PersistenceWarning({ message }) {
  if (!message) {
    return null
  }

  return (
    <aside className="persistence-warning" role="alert" aria-label="Advertencia de almacenamiento">
      <strong>Advertencia de almacenamiento</strong>
      <p>{message}</p>
    </aside>
  )
}

export default PersistenceWarning
