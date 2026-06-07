# Chat

## Overview

KinEvents includes a family group chat where all approved members can send text messages. Messages are paginated with infinite scroll, and the app polls for new messages every 5 seconds.

---

## Data Model

```typescript
interface IMessage {
  id: string
  from: string          // userId
  content: string
  type: 'text'          // extensible for future types
  readBy: string[]      // array of userIds
  deletedAt?: string    // soft delete
  createdAt: string
  updatedAt: string
}
```

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/chat/messages` | required | List messages (paginated) |
| `POST` | `/api/chat/messages` | required | Send a message |
| `GET` | `/api/chat/messages/:id` | required | Get a single message |
| `DELETE` | `/api/chat/messages/:id` | owner or admin | Delete a message |
| `POST` | `/api/chat/messages/read` | required | Mark messages as read |
| `GET` | `/api/chat/unread-count` | required | Get unread message count |

---

## Message Pagination

Messages use cursor-based pagination rather than offset/page numbers, which avoids the "missed messages" problem when new items are inserted between pages.

**Query params for `GET /api/chat/messages`:**

| Param | Type | Description |
|-------|------|-------------|
| `limit` | number | Messages per page (default: 30) |
| `before` | string | ISO timestamp cursor — returns messages older than this |

**Flow for infinite scroll:**

1. Initial load: `GET /api/chat/messages?limit=30` — returns newest 30 messages
2. User scrolls to the top: `GET /api/chat/messages?before=<oldest.createdAt>&limit=30`
3. Repeat until no more messages

**Frontend hook:** `FrontEnd/src/features/chat/hooks/useChat.ts` — uses `useInfiniteQuery` from React Query.

---

## Sending a Message

**Frontend files:**
- `FrontEnd/src/features/chat/components/ChatInput.tsx`
- `FrontEnd/src/features/chat/hooks/useChat.ts`

**Flow:**
1. User types in the `ChatInput` and submits
2. `POST /api/chat/messages` with `{ content }`
3. Backend writes the message atomically via MongoDB `$push`
4. React Query cache is updated so the new message appears immediately

---

## Read Status

The `readBy` array tracks which users have seen each message. The unread count badge in the sidebar is derived from messages where `req.user.id` is not in `readBy`.

**Mark as read:** `POST /api/chat/messages/read` accepts `{ messageIds: string[] }` and uses a MongoDB `$set` with an array filter to add the calling user's ID to each message's `readBy` array.

---

## Message Deletion

- The message owner OR an admin can delete a message
- Deletion is a **soft delete** — `deletedAt` is set to the current timestamp
- Deleted messages are filtered out in list responses
- The delete operation uses atomic `$set` with permission verification in the service layer

---

## Polling for New Messages

The frontend polls `GET /api/chat/messages` every 5 seconds using React Query's `refetchInterval`. This keeps the chat live without requiring a WebSocket connection, which is appropriate for a serverless backend.

---

## Frontend Components

| Component | File | Purpose |
|-----------|------|---------|
| `ChatHeader` | `components/ChatHeader.tsx` | Title and member count |
| `ChatScrollArea` | `components/ChatScrollArea.tsx` | Scrollable message list with infinite scroll trigger |
| `ChatMessage` | `components/ChatMessage.tsx` | Individual message bubble (own vs others) |
| `ChatInput` | `components/ChatInput.tsx` | Text input and send button |

**Page:** `FrontEnd/src/pages/user/Messages.tsx`
