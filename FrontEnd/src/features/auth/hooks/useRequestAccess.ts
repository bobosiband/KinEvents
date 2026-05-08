import { useQuery, useMutation } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { listAccessRequests, requestAccess, approveAccess, revokeAccess } from '../api/auth.api'

export function useRequestAccess() {
  return useMutation({ mutationFn: requestAccess })
}

export function useAccessRequests() {
  return useQuery({ queryKey: ['access-requests'], queryFn: listAccessRequests })
}

export function useApproveAccess() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: approveAccess,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-requests'] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useRevokeAccess() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: revokeAccess,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-requests'] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
