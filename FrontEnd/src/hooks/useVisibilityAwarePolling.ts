import { useEffect, useRef } from 'react'

interface PollingOptions {
  readonly intervalMs: number
  readonly maxBackoffSteps?: number
  readonly hiddenIntervalMs?: number
}

export function useVisibilityAwarePolling(
  fn: () => Promise<void> | void,
  options: PollingOptions,
): void {
  const errorBackoffRef = useRef<number>(0)
  const fnRef = useRef(fn)
  fnRef.current = fn

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const maxBackoffSteps = options.maxBackoffSteps ?? 5
    const hiddenInterval = options.hiddenIntervalMs ?? 30_000

    const tick = async (): Promise<void> => {
      if (cancelled) return
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        timer = setTimeout(() => void tick(), hiddenInterval)
        return
      }
      try {
        await fnRef.current()
        errorBackoffRef.current = 0
      } catch {
        errorBackoffRef.current = Math.min(errorBackoffRef.current + 1, maxBackoffSteps)
      }
      const nextIn = options.intervalMs * Math.pow(2, errorBackoffRef.current)
      timer = setTimeout(() => void tick(), nextIn)
    }

    void tick()

    const onVisibilityChange = (): void => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        if (timer !== undefined) clearTimeout(timer)
        void tick()
      }
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange)
    }

    return () => {
      cancelled = true
      if (timer !== undefined) clearTimeout(timer)
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibilityChange)
      }
    }
  }, [options.intervalMs, options.hiddenIntervalMs, options.maxBackoffSteps])
}
