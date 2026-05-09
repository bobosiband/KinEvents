import React, { useEffect, useState } from 'react'
import styles from './Toast.module.css'

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
    <div className={`${styles.toast} ${styles[type]} ${isExiting ? styles.exiting : ''}`}>
      <div className={styles.content}>
        <span className={styles.icon}>{getIcon(type)}</span>
        <span className={styles.message}>{message}</span>
      </div>

      <div className={styles.actions}>
        {action && (
          <button
            type="button"
            className={styles.actionButton}
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
          className={styles.closeButton}
          onClick={handleDismiss}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>

      {duration > 0 && <div className={styles.progressBar} style={{ width: `${progress}%` }} />}
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
    <div className={styles.container}>
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
