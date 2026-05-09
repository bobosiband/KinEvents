import React, { useEffect, useRef } from 'react'
import styles from './Modal.module.css'

export interface ModalProps {
  title?: string
  open: boolean
  onClose: () => void
  children?: React.ReactNode
}

export const Modal: React.FC<ModalProps> = ({ title, open, onClose, children }) => {
  const backdropRef = useRef<HTMLDivElement | null>(null)
  const firstRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab') {
        // Basic focus trap: keep focus within backdrop
        const focusables = backdropRef.current?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') || []
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); (last as HTMLElement).focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); (first as HTMLElement).focus()
        }
      }
    }

    if (open) {
      document.addEventListener('keydown', onKey)
      // store scroll top
      document.body.style.overflow = 'hidden'
      setTimeout(() => firstRef.current?.focus(), 60)
    }

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className={styles.backdrop} ref={backdropRef} onMouseDown={(e) => { if (e.target === backdropRef.current) onClose() }} role="dialog" aria-modal>
      <div className={styles.panel} onMouseDown={(e) => e.stopPropagation()}>
        <div style={{ position: 'relative' }}>
          <div className={styles.title}>{title}</div>
          <button ref={firstRef} aria-label="Close" onClick={onClose} className={styles.close}>✕</button>
        </div>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  )
}

export default Modal

