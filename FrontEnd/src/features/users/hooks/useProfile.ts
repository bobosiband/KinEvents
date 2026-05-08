import { useMutation } from '@tanstack/react-query'
import { updateUser, type ProfilePayload } from '../api/users.api'

export function useProfile(userId: string) {
  return useMutation({
    mutationFn: (payload: ProfilePayload) => updateUser(userId, payload),
  })
}
