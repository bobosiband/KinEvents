export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  MEMBER: 'member',
} as const

export type Role = typeof ROLES[keyof typeof ROLES]

export const ACCESS_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  REVOKED: 'revoked',
} as const

export const RSVP_STATUS = {
  YES: 'yes',
  NO: 'no',
  MAYBE: 'maybe',
} as const

export const EVENT_TYPES = {
  BIRTHDAY: 'birthday',
  CUSTOM: 'custom',
} as const

export const NOTIFICATION_LEVELS = {
  ALL: 'all',
  IMPORTANT: 'important',
  NONE: 'none',
} as const