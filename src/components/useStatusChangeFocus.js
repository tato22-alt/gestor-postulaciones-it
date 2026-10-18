import { useEffect, useRef } from 'react'

// A status button usually disappears after it is used, because the allowed targets change.
// When the user triggered the change from this card, move focus to the first status action
// that now exists, so keyboard users keep their place instead of falling back to <body>.
// Changes that arrive from another tab never move focus.
export default function useStatusChangeFocus(status) {
  const cardRef = useRef(null)
  const isAwaitingStatusChangeRef = useRef(false)

  useEffect(() => {
    if (!isAwaitingStatusChangeRef.current) return

    isAwaitingStatusChangeRef.current = false
    cardRef.current?.querySelector('.status-action-button')?.focus()
  }, [status])

  const markStatusChangeRequested = () => {
    isAwaitingStatusChangeRef.current = true
  }

  return { cardRef, markStatusChangeRequested }
}
