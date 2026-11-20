import type { UserRole } from '../interfaces/user.interface'
import { PermissionPolicy } from './policies/PermissionPolicy'
import { RolePolicy } from './policies/RolePolicy'

/**
 * Declarative registry: every route in app.ts must appear here with its
 * required policy. Routes that are intentionally public (login, flags,
 * health) use `PublicRoute`. The coverage test in tests/routeCoverage.test.ts
 * walks app.ts and fails if any route is missing an entry.
 *
 * Behaviour is not altered by this registry — the existing withAuth(..., role)
 * calls still enforce at runtime. The registry is the source of truth the
 * test checks against to catch new handlers that ship unprotected.
 */

export const PublicRoute: unique symbol = Symbol('PublicRoute')
export type PublicRouteMarker = typeof PublicRoute

export interface IRouteRequirement {
  readonly policy: PermissionPolicy | PublicRouteMarker
  readonly notes?: string
}

const ADMIN_ONLY = new RolePolicy(['admin'])
const ADMIN_OR_MANAGER = new RolePolicy(['admin', 'manager'])
const ANY_APPROVED: PermissionPolicy = new RolePolicy(['admin', 'manager', 'member'])

export const ROUTE_POLICIES: Readonly<Record<string, IRouteRequirement>> = {
  // Auth
  '/api/auth/request-access': { policy: PublicRoute, notes: 'Unauthenticated access-request submission' },
  '/api/auth/login': { policy: PublicRoute },
  '/api/auth/approve-access': { policy: { ...ADMIN_ONLY } as PermissionPolicy },
  '/api/auth/revoke-access': { policy: ADMIN_ONLY },
  '/api/auth/pin/verify': { policy: PublicRoute, notes: 'Challenge token is checked inside the handler' },
  '/api/auth/pin/setup/request': { policy: ADMIN_OR_MANAGER },
  '/api/auth/pin/setup/confirm': { policy: ADMIN_OR_MANAGER },
  '/api/auth/pin/change': { policy: ADMIN_OR_MANAGER },
  '/api/auth/devices': { policy: ADMIN_OR_MANAGER },
  '/api/auth/devices/forget': { policy: ADMIN_OR_MANAGER },
  // Users
  '/api/users': { policy: ANY_APPROVED, notes: 'Any approved user can list; mutations role-gated per method inside' },
  '/api/users/promote': { policy: ADMIN_ONLY },
  '/api/users/:id': { policy: ANY_APPROVED, notes: 'Per-method inside: admin/self for PATCH, admin for DELETE' },
  // Events
  '/api/events': { policy: ANY_APPROVED },
  '/api/events/reminders': { policy: ADMIN_ONLY },
  '/api/events/rsvp': { policy: ANY_APPROVED },
  '/api/events/:id': { policy: ANY_APPROVED, notes: 'Create/update/cancel checked inside for admin/manager/self' },
  // Birthdays
  '/api/birthdays/upcoming': { policy: ANY_APPROVED },
  '/api/birthdays/reminders': { policy: ADMIN_ONLY },
  '/api/birthdays/generate': { policy: ADMIN_ONLY },
  // Notifications
  '/api/notifications': { policy: ANY_APPROVED },
  '/api/notifications/send': { policy: ADMIN_OR_MANAGER },
  '/api/notifications/:id/read': { policy: ANY_APPROVED },
  '/api/notifications/:id': { policy: ANY_APPROVED },
  // Gift pools
  '/api/gift-pools/by-event/:eventId': { policy: ANY_APPROVED, notes: 'Any approved user can view an event pool' },
  '/api/gift-pools/:id/confirm-received': { policy: ADMIN_OR_MANAGER },
  '/api/gift-pools/:id/pending-contributions': { policy: ADMIN_OR_MANAGER },
  '/api/gift-pools/:id/approve-contribution': { policy: ADMIN_OR_MANAGER },
  '/api/gift-pools/:id/reject-contribution': { policy: ADMIN_OR_MANAGER },
  '/api/gift-pools/:id/record-contribution': { policy: ADMIN_OR_MANAGER, notes: 'Record-on-behalf is admin/manager only' },
  '/api/gift-pools/:id/contribute': { policy: ANY_APPROVED, notes: 'Any approved user can contribute to themselves' },
  '/api/gift-pools/:id': { policy: ANY_APPROVED, notes: 'GET any approved; close is admin/manager (checked inside)' },
  '/api/gift-pools': { policy: ADMIN_OR_MANAGER, notes: 'Create/list management views' },
  // Chat
  '/api/chat/messages/read': { policy: ANY_APPROVED },
  '/api/chat/messages': { policy: ANY_APPROVED },
  '/api/chat/messages/:id': { policy: ANY_APPROVED, notes: 'Delete checked inside (self or admin)' },
  '/api/chat/unread-count': { policy: ANY_APPROVED },
  // Admin
  '/api/admin/create-admin': { policy: ADMIN_ONLY },
  '/api/admin/dashboard': { policy: ADMIN_ONLY },
  '/api/admin/content': { policy: ADMIN_ONLY },
  '/api/admin/cleanup': { policy: ADMIN_ONLY },
  '/api/admin/email-logs': { policy: ADMIN_ONLY },
  '/api/admin/invalid-phones': { policy: ADMIN_ONLY },
  // System
  '/api/debug/db': { policy: ADMIN_ONLY },
  '/api/config/flags': { policy: PublicRoute, notes: 'Non-sensitive flag snapshot' },
  // Calendar sync (feature-flagged; routes return 404 when flag is off)
  '/api/ics/feed': { policy: PublicRoute, notes: 'Token-authenticated ICS feed' },
  '/api/me/ics/rotate': { policy: ANY_APPROVED, notes: 'Rotate own ICS token' },
  // Event comments (flag-gated)
  '/api/events/:eventId/comments': { policy: ANY_APPROVED },
  '/api/events/:eventId/comments/:commentId': { policy: ANY_APPROVED, notes: 'PATCH/DELETE self or admin inside handler' },
  // Wishes wall (flag-gated)
  '/api/celebrate/:eventId': { policy: ANY_APPROVED, notes: 'Celebration page read' },
  '/api/celebrate/:eventId/wishes': { policy: ANY_APPROVED, notes: 'Create or update own wish' },
  '/api/admin/wishes/:id/hide': { policy: ADMIN_OR_MANAGER, notes: 'Moderate: hide a wish' },
  // Shared lists (flag-gated)
  '/api/events/:eventId/lists': { policy: ANY_APPROVED, notes: 'GET any; POST admin/manager inside handler' },
  '/api/lists/:listId/items': { policy: ANY_APPROVED, notes: 'GET any; POST admin/manager inside handler' },
  '/api/lists/items/:itemId/claim': { policy: ANY_APPROVED, notes: 'POST to claim; DELETE to release own claim' },
}

export function policyFor(path: string): IRouteRequirement | null {
  return ROUTE_POLICIES[path] ?? null
}
