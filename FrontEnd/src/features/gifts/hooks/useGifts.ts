import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { closePool, confirmReceived, contribute, createPool, getPoolByEvent } from '../api/gifts.api'
import type { ConfirmReceivedPayload, ContributePayload } from '../types/gift.types'

export function useGiftPool(eventId: string) {
  return useQuery({
    queryKey: ['gift-pool', eventId],
    queryFn: () => getPoolByEvent(eventId),
    enabled: Boolean(eventId),
  })
}

export function useCreatePool() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createPool,
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['gift-pool', vars.eventId] })
    },
  })
}

export function useContribute(poolId: string, eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ContributePayload) => contribute(poolId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gift-pool', eventId] })
    },
  })
}

export function useClosePool(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: closePool,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gift-pool', eventId] })
    },
  })
}

export function useConfirmReceived(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ poolId, payload }: { poolId: string; payload: ConfirmReceivedPayload }) =>
      confirmReceived(poolId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gift-pool', eventId] })
    },
  })
}
