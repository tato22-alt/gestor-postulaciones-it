function WorkspaceTabs() {
  return (
    <nav className="workspace-tabs" aria-label="Secciones principales">
      <button className="workspace-tab workspace-tab-active" type="button" aria-current="page">
        Oportunidades
      </button>
      <button className="workspace-tab" type="button">
        Postulaciones
      </button>
    </nav>
  )
}

export default WorkspaceTabs
