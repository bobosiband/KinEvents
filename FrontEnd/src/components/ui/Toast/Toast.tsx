import React, { useEffect, useState } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastMessage {
  id: string
  type: ToastType
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastProps extends Omit<ToastMessage, 'id'> {
  id: string
  onDismiss: (id: string) => void
}

/**
 * Toast Component - Individual notification
 */
export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  message,
  duration = 3000,
  action,
  onDismiss,
}) => {
  const [isExiting, setIsExiting] = useState(false)
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    if (duration === 0) return

    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(remaining)

      if (remaining === 0) {
        clearInterval(interval)
        handleDismiss()
      }
    }, 50)

    return () => clearInterval(interval)
  }, [duration])

  const handleDismiss = () => {
    setIsExiting(true)
    setTimeout(() => {
      onDismiss(id)
    }, 300)
  }

  return (
    <div className={[
      'relative overflow-hidden rounded-2xl border bg-card px-4 py-3 shadow-lg transition-all duration-300',
      type === 'success' ? 'border-emerald-500/20' : '',
      type === 'error' ? 'border-destructive/20' : '',
      type === 'warning' ? 'border-amber-500/20' : '',
      type === 'info' ? 'border-primary/20' : '',
      isExiting ? 'translate-x-3 opacity-0' : '',
    ].filter(Boolean).join(' ')}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-sm font-semibold">{getIcon(type)}</span>
        <span className="flex-1 text-sm text-foreground">{message}</span>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        {action && (
          <button
            type="button"
            className="rounded-xl px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/10"
            onClick={() => {
              action.onClick()
              handleDismiss()
            }}
          >
            {action.label}
          </button>
        )}
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition hover:bg-muted/80 hover:text-foreground"
          onClick={handleDismiss}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>

      {duration > 0 && <div className="absolute bottom-0 left-0 h-1 bg-primary/40 transition-[width]" style={{ width: `${progress}%` }} />}
    </div>
  )
}

/**
 * Toast Container - Manages multiple toasts
 */
interface ToastContainerProps {
  toasts: ToastMessage[]
  onDismiss: (id: string) => void
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed right-4 top-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          {...toast}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  )
}

/**
 * useToast Hook - For managing toasts in components
 */
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const show = (message: string, type: ToastType = 'info', duration = 3000, action?: ToastMessage['action']) => {
    const id = `toast-${Date.now()}-${Math.random()}`
    const toast: ToastMessage = {
      id,
      type,
      message,
      duration,
      action,
    }
    setToasts(prev => [...prev, toast])
    return id
  }

  const dismiss = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const success = (message: string, duration?: number) => show(message, 'success', duration)
  const error = (message: string, duration?: number) => show(message, 'error', duration)
  const info = (message: string, duration?: number) => show(message, 'info', duration)
  const warning = (message: string, duration?: number) => show(message, 'warning', duration)

  return {
    toasts,
    show,
    dismiss,
    success,
    error,
    info,
    warning,
  }
}

function getIcon(type: ToastType): string {
  switch (type) {
    case 'success':
      return '✓'
    case 'error':
      return '✕'
    case 'warning':
      return '⚠'
    case 'info':
      return 'ℹ'
    default:
      return '●'
  }
}

export default Toast
