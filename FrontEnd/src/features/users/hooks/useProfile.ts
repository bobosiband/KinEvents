import { useMutation } from '@tanstack/react-query'
import { updateUser, type ProfilePayload, type UpdateUserResponse } from '../api/users.api'

export function useProfile(userId: string) {
  return useMutation<UpdateUserResponse, Error, ProfilePayload>({
    mutationFn: (payload: ProfilePayload) => updateUser(userId, payload),
  })
}
