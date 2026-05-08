import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getData, postData } from '@/services/api/apiClient'
import { ENDPOINTS } from '@/services/api/endpoints'
export interface AdminDashboardData {
  users: {
    total: number
    admins: number
    managers: number
    members: number
    approved: number
    pending: number
    revoked: number
  }
  accessRequests: {
    total: number
    pending: number
    approved: number
    rejected: number
  }
  events: {
    total: number
    birthdays: number
    custom: number
    locked: number
  }
}

export interface SiteContent {
  key: 'homepage_title' | 'homepage_subtitle' | 'homepage_image_url' | 'announcement'
  value: string
  updatedAt: string
  updatedBy: string
}

export interface SiteContentForm {
  homepageTitle: string
  homepageSubtitle: string
  announcement: string
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => getData<AdminDashboardData>(ENDPOINTS.ADMIN_DASHBOARD),
  })
}

export function useSiteContent() {
  return useQuery({
    queryKey: ['admin-content'],
    queryFn: () => getData<SiteContent[]>(ENDPOINTS.ADMIN_CONTENT),
  })
}

export function useSaveSiteContent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { key: SiteContent['key']; value: string; updatedBy: string }) =>
      postData<SiteContent, typeof payload>(ENDPOINTS.ADMIN_CONTENT, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-content'] }),
  })
}
