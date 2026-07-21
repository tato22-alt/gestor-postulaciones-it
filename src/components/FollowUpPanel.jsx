function FollowUpPanel() {
  return (
    <section className="panel follow-up-panel" aria-labelledby="follow-ups-title">
      <div>
        <p className="section-kicker">Agenda</p>
        <h2 id="follow-ups-title">Próximos seguimientos</h2>
      </div>
      <p className="muted-message">No tenés seguimientos pendientes.</p>
    </section>
  )
}

export default FollowUpPanel
