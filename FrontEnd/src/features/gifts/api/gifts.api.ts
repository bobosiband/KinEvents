import { getData, patchData, postData } from '@/services/api/apiClient'
import { ENDPOINTS } from '@/services/api/endpoints'
import type {
  ConfirmReceivedPayload,
  ContributePayload,
  GiftContribution,
  GiftPool,
  GiftPoolStatus,
} from '../types/gift.types'

export function getPoolByEvent(eventId: string): Promise<GiftPoolStatus | null> {
  return getData<GiftPoolStatus | null>(ENDPOINTS.GIFT_POOL_BY_EVENT(eventId))
}

export function createPool(payload: {
  eventId: string
  birthdayUserId: string
  targetAmount?: number
  currency?: string
}): Promise<GiftPool> {
  return postData<GiftPool, typeof payload>(ENDPOINTS.GIFT_POOLS, payload)
}

export function contribute(poolId: string, payload: ContributePayload): Promise<GiftContribution> {
  return postData<GiftContribution, ContributePayload>(ENDPOINTS.GIFT_POOL_CONTRIBUTE(poolId), payload)
}

export function closePool(poolId: string): Promise<GiftPool> {
  return patchData<GiftPool, Record<string, never>>(ENDPOINTS.GIFT_POOL_CLOSE(poolId), {})
}

export function confirmReceived(poolId: string, payload: ConfirmReceivedPayload): Promise<GiftPool> {
  return postData<GiftPool, ConfirmReceivedPayload>(ENDPOINTS.GIFT_POOL_CONFIRM_RECEIVED(poolId), payload)
}
