import { getData } from '@/services/api/apiClient'
import { ENDPOINTS } from '@/services/api/endpoints'
import type { IFeatureFlags } from '../types'
import { DEFAULT_FEATURE_FLAGS } from '../types'

export class FeatureFlagsApi {
  public static async fetch(): Promise<IFeatureFlags> {
    try {
      const data = await getData<IFeatureFlags>(ENDPOINTS.CONFIG_FLAGS)
      return { ...DEFAULT_FEATURE_FLAGS, ...data }
    } catch {
      return DEFAULT_FEATURE_FLAGS
    }
  }
}
