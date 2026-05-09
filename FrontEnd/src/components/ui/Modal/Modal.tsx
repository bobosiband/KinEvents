import React, { useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'

export interface ModalProps {
  /**
   * Preferred prop.
   */
  isOpen?: boolean
  /**
   * Legacy prop alias. Prefer `isOpen`.
   */
  open?: boolean
  onClose: () => void


  title?: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  closeOnEscape?: boolean
  closeOnBackdropClick?: boolean
  className?: string
}

/**
 * Modal Component
 * 
 * Displays content in a modal dialog with backdrop overlay.
 * Supports keyboard navigation (Escape to close) and focus trapping.
 * 
 * @example
 * const [isOpen, setIsOpen] = useState(false)
 * return (
 *   <>
 *     <button onClick={() => setIsOpen(true)}>Open Modal</button>
 *     <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Confirm">
 *       <p>Are you sure?</p>
 *     </Modal>
 *   </>
 * )
 */
export const Modal = React.forwardRef<HTMLDivElement, ModalProps>(function Modal(
  {
    isOpen,
    open,
    onClose,

    title,
    children,
    footer,
    size = 'md',
    closeOnEscape = true,
    closeOnBackdropClick = true,
    className,
  },
  ref
) {
  const resolvedIsOpen = open ?? isOpen
  const modalRef = useRef<HTMLDivElement>(null)

  const firstFocusableRef = useRef<HTMLElement>(null)
  const lastFocusableRef = useRef<HTMLElement>(null)

  // Handle Escape key
  useEffect(() => {
    if (!resolvedIsOpen || !closeOnEscape) return


    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [resolvedIsOpen, closeOnEscape, onClose])

  // Focus trap
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )

      if (!focusableElements || focusableElements.length === 0) return

      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    const handleBackdropClick = (e: MouseEvent) => {
      if (!closeOnBackdropClick) return
      if (e.target === e.currentTarget) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    const backdrop = modalRef.current?.parentElement
    if (backdrop) {
      backdrop.addEventListener('click', handleBackdropClick)
    }

    // Focus first focusable element
    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (focusableElements && focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus()
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (backdrop) {
        backdrop.removeEventListener('click', handleBackdropClick)
      }
    }
  }, [isOpen, closeOnBackdropClick, onClose])

  if (!resolvedIsOpen) return null

  const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
  }

  const modalClasses = [
    'relative w-[min(92vw,100%)] rounded-3xl border border-border bg-background p-6 shadow-2xl',
    sizeClasses[size],
    className || '',
  ].filter(Boolean).join(' ')

  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm" role="presentation">
      <div
        ref={modalRef}
        className={modalClasses}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {title && (
          <div className="mb-4 flex items-start justify-between gap-3">
            <h2 id="modal-title" className="text-xl font-semibold">
              {title}
            </h2>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition hover:bg-muted/80 hover:text-foreground"
              onClick={onClose}
              aria-label="Close modal"
            >
              ×
            </button>
          </div>
        )}

        <div className="space-y-4">{children}</div>

        {footer && <div className="mt-6 flex flex-wrap justify-end gap-3">{footer}</div>}
      </div>
    </div>,
    document.body
  )
})

Modal.displayName = 'Modal'

export default Modal
