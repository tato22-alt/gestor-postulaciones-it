function SuccessFeedback({ message, durationMs }) {
  if (!message) {
    return null
  }

  return (
    <div
      className="success-feedback"
      role="status"
      aria-live="polite"
      style={{ '--success-feedback-duration': `${durationMs}ms` }}
    >
      <span className="success-feedback__icon" aria-hidden="true">
        ✓
      </span>
      <span>{message}</span>
    </div>
  )
}

export default SuccessFeedback
