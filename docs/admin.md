# Admin Dashboard

## Overview

The admin dashboard gives admins and managers visibility into the platform's health and tools to manage users, events, access requests, site content, and emails.

---

## Access Control

Admin pages are wrapped in `AdminRoute`, which redirects to home if the user's role is not `admin` or `manager`. Some features within the admin section are further restricted to `admin`-only (e.g., content editing, cleanup, email logs).

---

## Dashboard Metrics

**Endpoint:** `GET /api/admin/dashboard`  
**Frontend:** `FrontEnd/src/admin/pages/AdminDashboard/AdminDashboard.tsx`

The dashboard displays a summary of:

| Metric Group | Metrics |
|---|---|
| Users | Total, admins, managers, members, approved, pending, revoked |
| Access Requests | Pending, approved, rejected |
| Events | Total, birthday events, custom events, locked events |

---

## User Management

**Frontend:** `FrontEnd/src/admin/pages/ManageUsers/ManageUsers.tsx`

Actions available:
- View all users in a data table
- Change a user's role (`POST /api/users/promote`)
- Revoke user access (`POST /api/auth/revoke-access`)
- Navigate to a user's profile

---

## Access Request Management

**Frontend:** `FrontEnd/src/admin/pages/AccessRequests/AccessRequests.tsx`

Shows all pending access requests. For each request:
- Approve → `POST /api/auth/approve-access` → user created/activated, approval email sent
- Reject → same endpoint with reject flag → request archived, rejection email sent

A badge on the sidebar nav shows the pending count.

---

## Event Management

**Frontend:** `FrontEnd/src/admin/pages/ManageEvents/ManageEvents.tsx`

Admins can:
- View all events in a table
- Lock / unlock events
- Edit any event (bypasses ownership check)
- Delete any event

Uses the same event API endpoints but the admin's `edit_any_event` and `delete_any_event` capabilities bypass ownership checks in the backend service.

---

## Site Content Management

**Endpoint:** `GET / PUT /api/admin/content`  
**Frontend:** `FrontEnd/src/admin/pages/SiteSettings/SiteSettings.tsx`  
**Backend service:** `BackEnd/src/services/content.service.ts`

Content blocks are stored in the `content` array in the database. Each block has:
- `key` — unique identifier (e.g., `'landing_hero_title'`)
- `value` — the current text or HTML
- `type` — `'text' | 'html' | 'url'`

Admins can update these through a form. The landing page and other public-facing content reads these blocks at render time.

---

## Email Logs & Management

**Frontend:** accessible from the SiteSettings or a dedicated admin tab

| Endpoint | Description |
|----------|-------------|
| `GET /api/admin/email-logs` | View all email sending attempts with status |
| `POST /api/admin/email-resend` | Resend a previously failed email |
| `POST /api/admin/email-test` | Send a test email to verify transport configuration |

Email log entries include: recipient, subject, notification type, status (`sent` / `failed`), timestamp, and error message on failure.

---

## Data Cleanup

**Endpoint:** `POST /api/admin/cleanup`  
**Backend service:** `BackEnd/src/services/cleanup.service.ts`

Removes old data to keep the single document from growing unbounded:
- Notifications older than N days
- Closed gift pools older than N days
- Archived access request history

The retention window is configurable per resource type in the request body.

---

## Create Admin User

**Endpoint:** `POST /api/admin/create-admin`

A bootstrap endpoint used during initial setup to create the first admin user, or to promote a user to admin when no other admin exists. This endpoint may be restricted or disabled in production.

---

## DataTable Component

`FrontEnd/src/admin/pages/DataTable/DataTable.tsx`

A reusable table component used across all admin list views. Features:
- Column definitions with custom renderers
- Sorting
- Pagination
- Row action menus

All admin list pages (users, events, access requests) share this component.
