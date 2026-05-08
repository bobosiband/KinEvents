import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteUser, getUser, getUsers, promoteUser } from '../api/users.api'
import type { UserRole } from '../types/user.types'

export function useUsers(params?: { role?: string; status?: string }) {
  return useQuery({ queryKey: ['users', params], queryFn: () => getUsers(params) })
}

export function useUser(id: string) {
  return useQuery({ queryKey: ['user', id], queryFn: () => getUser(id), enabled: Boolean(id) })
}

export function usePromoteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) => promoteUser(userId, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}
