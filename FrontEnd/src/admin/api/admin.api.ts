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

export function getAdminDashboard(): Promise<AdminDashboardData> {
  return getData<AdminDashboardData>(ENDPOINTS.ADMIN_DASHBOARD)
}

export function getSiteContent(): Promise<SiteContent[]> {
  return getData<SiteContent[]>(ENDPOINTS.ADMIN_CONTENT)
}

export function saveSiteContent(payload: { key: SiteContent['key']; value: string; updatedBy: string }): Promise<SiteContent> {
  return postData<SiteContent, typeof payload>(ENDPOINTS.ADMIN_CONTENT, payload)
}
