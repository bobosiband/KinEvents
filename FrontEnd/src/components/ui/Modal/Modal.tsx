import { useEffect, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import styles from './Modal.module.css'

interface ModalProps {
  title: string
  open: boolean
  onClose: () => void
  children: ReactNode
}

export function Modal({ title, open, onClose, children }: ModalProps) {
  useEffect(() => {
    if (!open) return undefined
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={onClose}>
      <section className={styles.modal} role="dialog" aria-modal="true" aria-label={title} onMouseDown={event => event.stopPropagation()}>
        <header className={styles.header}>
          <h2>{title}</h2>
          <Button type="button" variant="ghost" size="sm" onClick={onClose} aria-label="Close modal">
            x
          </Button>
        </header>
        {children}
      </section>
    </div>
  )
}
