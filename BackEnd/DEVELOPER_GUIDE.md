# KinEvents Backend - Developer Guide

## Architecture Overview

### Authentication Flow

```
User Request → Express/Vercel Handler
    ↓
  withAuth Wrapper
    ├─ Extract Bearer token from Authorization header
    ├─ Verify JWT signature
    ├─ Attach user to request
    ├─ Check role (if required)
    └─ Call original handler OR return 401/403
    ↓
Handler (has access to req.user)
    ↓
Response
```

## Using withAuth in New Handlers

### Basic Usage (Authentication Only)
```typescript
import { withAuth, type RequestWithUser } from '../../src/middleware/withAuth'
import type { VercelResponse } from '@vercel/node'

function handler(req: RequestWithUser, res: VercelResponse) {
  // req.user is available here, guaranteed non-null
  console.log(`User: ${req.user.email}, Role: ${req.user.role}`)
  
  res.json({ success: true, data: req.user })
}

export default withAuth(handler)
```

### With Role Requirement (Authorization)
```typescript
// Require admin role
export default withAuth(handler, 'admin')

// Require one of multiple roles
export default withAuth(handler, ['admin', 'manager'])

// Require a capability (from role's capabilities array)
export default withAuth(handler, 'write:events')
```

## Request Types

```typescript
// Before protection
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(req: VercelRequest, res: VercelResponse) {
  // req.user doesn't exist
}

// After protection
import { withAuth, type RequestWithUser } from '../../src/middleware/withAuth'

function handler(req: RequestWithUser, res: VercelResponse) {
  // req.user exists and is typed as IUser
  if (req.user.role === 'admin') {
    // Do admin thing
  }
}

export default withAuth(handler)
```

## Common Patterns

### Check User's Own Resource
```typescript
function handler(req: RequestWithUser, res: VercelResponse) {
  const userId = req.query.id
  
  // Admin can access any resource
  if (req.user.role === 'admin') {
    // Proceed
  }
  // Regular users can only access their own
  else if (req.user.id === userId) {
    // Proceed
  } else {
    res.status(403).json({ success: false, message: 'Forbidden' })
  }
}
```

### Admin-Only Operations
```typescript
export default withAuth(handler, 'admin')

// Inside handler, user is guaranteed to be admin
function handler(req: RequestWithUser, res: VercelResponse) {
  // Safe to perform admin operations
  // req.user.role === 'admin' is guaranteed
}
```

### Public Endpoint (No Auth)
```typescript
// Don't use withAuth at all
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Anyone can access
}
```

## Error Handling

### Authentication Errors (401)
```typescript
// Returned automatically by withAuth
{
  "success": false,
  "message": "Missing authorization token" // or "Invalid or expired token"
}
```

### Authorization Errors (403)
```typescript
// Returned automatically by withAuth
{
  "success": false,
  "message": "Insufficient permissions"
}
```

### Validation Errors (400)
```typescript
// Your handler's responsibility
res.status(400).json({
  success: false,
  message: "Validation failed",
  details: parseResult.error.flatten()
})
```

## Input Validation Examples

### URL Fields
```typescript
import { z } from 'zod'

const schema = z.object({
  onlineLink: z.string().url().optional(),  // Validates URL format
  imageUrl: z.string().url().optional(),    // Validates URL format
})

// Valid: "https://example.com", "http://localhost:3001/image.png"
// Invalid: "not-a-url", "example.com", "just text"
```

### Date Fields
```typescript
const schema = z.object({
  birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),  // YYYY-MM-DD
  date: z.string().datetime().optional(),                         // ISO datetime
})

// Valid birthdays: "1990-05-15", "2000-12-31"
// Invalid: "05/15/1990", "May 15", "1990"

// Valid dates: "2024-01-15T10:30:00Z", "2024-01-15T10:30:00+00:00"
// Invalid: "2024-01-15", "January 15, 2024"
```

## Role & Capability System

### Built-in Roles
```typescript
type UserRole = 'admin' | 'manager' | 'member'

// Role capabilities defined in src/constants/roles.ts
const ROLE_CAPABILITIES = {
  admin: ['*'],  // All capabilities
  manager: ['manage:users', 'read:events', 'write:events', 'delete:events'],
  member: ['read:events', 'write:rsvp', 'read:notifications'],
}
```

### Checking Capabilities
```typescript
function handler(req: RequestWithUser, res: VercelResponse) {
  // Check by role (exact match)
  if (req.user.role === 'admin') {
    // Proceed
  }
  
  // Check by capability
  if (req.user.capabilities.includes('write:events')) {
    // Proceed
  }
  
  // For authorization in withAuth
  // Use role name: 'admin', 'manager', 'member'
  // Or capability name: 'write:events', 'manage:users', etc.
}
```

## Testing Protected Endpoints

### With Jest
```typescript
import jwt from 'jsonwebtoken'

const mockUser: IUser = {
  id: 'test-id',
  email: 'test@example.com',
  role: 'member',
  // ... other fields
}

const token = jwt.sign(mockUser, JWT_SECRET, { expiresIn: '7d' })

const req = {
  headers: {
    authorization: `Bearer ${token}`,
  },
  method: 'GET',
}

const handler = require('../api/endpoint').default
const res = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
}

await handler(req, res)
expect(res.json).toHaveBeenCalled()
```

### With cURL
```bash
# Get a token (from login or admin creation)
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}' | jq -r '.data.token')

# Use token on protected endpoint
curl -X GET http://localhost:3001/api/events \
  -H "Authorization: Bearer $TOKEN"
```

## Debugging

### Common Issues

**401 Unauthorized**
- Missing Authorization header
- Token is malformed
- Token is expired
- JWT_SECRET mismatch

Check:
```bash
# In your request
curl -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Verify token not expired
npm install -g jwt-cli
jwt-cli <your-token>
```

**403 Forbidden**
- User doesn't have required role/capability
- User passed auth but failed authorization check

Check:
```typescript
// Inside handler, inspect user
console.log(req.user.role, req.user.capabilities)

// Compare with route requirements
// export default withAuth(handler, 'admin')
```

**Validation Error (400)**
- Input data doesn't match schema
- URL format invalid
- Date format invalid

Check:
```typescript
// Response includes details
{
  "message": "Validation failed",
  "details": {
    "fieldErrors": {
      "onlineLink": ["Invalid url"]
    }
  }
}
```

## API Endpoints Summary

| Method | Endpoint | Auth | Role | Purpose |
|--------|----------|------|------|---------|
| POST | `/api/auth/request-access` | No | - | Request access |
| POST | `/api/auth/login` | No | - | Get token |
| POST | `/api/auth/approve-access` | Yes | admin | Approve request |
| POST | `/api/auth/revoke-access` | Yes | admin | Revoke access |
| GET | `/api/users` | Yes | - | List users |
| GET | `/api/users/:id` | Yes | - | Get user |
| PATCH | `/api/users/:id` | Yes | - | Update user |
| DELETE | `/api/users/:id` | Yes | admin | Delete user |
| POST | `/api/users/promote` | Yes | admin | Change role |
| GET | `/api/events` | Yes | - | List events |
| POST | `/api/events` | Yes | - | Create event |
| GET | `/api/events/:id` | Yes | - | Get event |
| PATCH | `/api/events/:id` | Yes | - | Update event |
| DELETE | `/api/events/:id` | Yes | - | Delete event |
| POST | `/api/events/rsvp` | Yes | - | RSVP to event |
| GET | `/api/birthdays/upcoming` | Yes | - | Get birthdays |
| POST | `/api/birthdays/generate` | Yes | admin | Generate events |
| POST | `/api/notifications/send` | Yes | - | Send notification |
| GET | `/api/admin/dashboard` | Yes | admin | Dashboard data |
| GET | `/api/admin/content` | Yes | admin | Get content |
| POST | `/api/admin/content` | Yes | admin | Update content |
| POST | `/api/admin/create-admin` | No | - | Create first admin |
