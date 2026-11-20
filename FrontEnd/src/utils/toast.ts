import toast from 'react-hot-toast'

type ToastKind = 'error' | 'success' | 'info'

const RecentWindowMs = 3000
const recent = new Map<string, number>()

export function showToast(kind: ToastKind, message: string): void {
  const key = `${kind}:${message}`
  const now = Date.now()
  const last = recent.get(key) ?? 0
  if (last > now - RecentWindowMs) return
  recent.set(key, now)

  if (recent.size > 100) {
    for (const [existingKey, ts] of recent) {
      if (ts < now - RecentWindowMs) recent.delete(existingKey)
    }
  }

  if (kind === 'error') toast.error(message)
  else if (kind === 'success') toast.success(message)
  else toast(message)
}

export const showErrorToast = (message: string): void => showToast('error', message)
export const showSuccessToast = (message: string): void => showToast('success', message)
export const showInfoToast = (message: string): void => showToast('info', message)
