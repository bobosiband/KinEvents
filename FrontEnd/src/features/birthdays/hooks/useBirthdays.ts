import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { generateBirthdayEvents, getUpcomingBirthdays } from '../api/birthdays.api'

export function useBirthdays(limit?: number) {
  return useQuery({ queryKey: ['birthdays', limit], queryFn: () => getUpcomingBirthdays(limit) })
}

export function useGenerateBirthdays() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: generateBirthdayEvents,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  })
}
