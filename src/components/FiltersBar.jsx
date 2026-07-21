function FiltersBar() {
  return (
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
  )
}

export default FiltersBar
