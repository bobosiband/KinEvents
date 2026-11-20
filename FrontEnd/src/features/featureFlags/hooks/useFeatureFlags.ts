import { useQuery } from '@tanstack/react-query'
import { FeatureFlagsApi } from '../api/featureFlagsApi'
import type { IFeatureFlags } from '../types'
import { DEFAULT_FEATURE_FLAGS } from '../types'

const FIVE_MINUTES: number = 1000 * 60 * 5

export function useFeatureFlags(): IFeatureFlags {
  const query = useQuery({
    queryKey: ['featureFlags'],
    queryFn: () => FeatureFlagsApi.fetch(),
    staleTime: FIVE_MINUTES,
    gcTime: FIVE_MINUTES,
    retry: false,
  })

  return query.data ?? DEFAULT_FEATURE_FLAGS
}
