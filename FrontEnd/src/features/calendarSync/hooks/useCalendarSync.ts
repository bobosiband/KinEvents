import { useMutation } from '@tanstack/react-query'
import { postData } from '@/services/api/apiClient'
import { useFeatureFlags } from '@/features/featureFlags'

interface RotateResponse {
  readonly token: string
}

export interface ICalendarSyncHook {
  readonly enabled: boolean
  readonly rotate: () => Promise<RotateResponse>
  readonly feedUrl: (token: string, apiBase: string) => string
}

export function useCalendarSync(): ICalendarSyncHook {
  const flags = useFeatureFlags()
  const mutation = useMutation({
    mutationFn: () => postData<RotateResponse, Record<string, never>>('/api/me/ics/rotate', {}),
  })

  return {
    enabled: flags.calendarSync,
    rotate: async (): Promise<RotateResponse> => {
      return mutation.mutateAsync()
    },
    feedUrl: (token: string, apiBase: string): string => `${apiBase.replace(/\/$/, '')}/api/ics/feed?token=${encodeURIComponent(token)}`,
  }
}
