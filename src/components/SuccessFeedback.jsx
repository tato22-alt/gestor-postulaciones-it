// The live region stays mounted so screen readers reliably announce each new message;
// only its content changes. The keyed inner element restarts the fade for every message.
function SuccessFeedback({ message, messageId, durationMs }) {
  return (
    <div className="success-feedback-region" role="status" aria-live="polite">
      {message && (
        <div
          key={messageId}
          className="success-feedback"
          style={{ '--success-feedback-duration': `${durationMs}ms` }}
        >
          <span className="success-feedback__icon" aria-hidden="true">
            ✓
          </span>
          <span>{message}</span>
        </div>
      )}
    </div>
  )
}

export default SuccessFeedback
