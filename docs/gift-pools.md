# Gift Pools & Contributions

## Overview

Gift pools allow the family to pool money for a gift tied to an event. Any family member can contribute, an admin verifies the payment, and the birthday person confirms they received the gift.

---

## Data Models

### Gift Pool

```typescript
interface IGiftPool {
  id: string
  eventId: string
  birthdayUserId?: string
  targetAmount: number
  currency: string          // default: 'AUD'
  status: 'open' | 'closed'
  giftDescription?: string
  createdBy: string         // userId
  createdAt: string
  updatedAt: string
  receivedAt?: string
  confirmedBy?: string      // userId who confirmed receipt
  verifiedAt?: string
}
```

### Gift Contribution

```typescript
interface IGiftContribution {
  id: string
  poolId: string
  paidBy: string            // userId
  onBehalfOf: string[]      // userIds (e.g. contributing for a spouse)
  amount: number
  paymentMethod: 'bank_transfer' | 'cash' | 'paypal' | 'other'
  reference?: string        // bank transfer reference, PayPal ID, etc.
  note?: string
  status: ContributionStatus
  verifiedBy?: string       // userId
  verifiedAt?: string
  rejectionReason?: string
  createdAt: string
  updatedAt: string
}

type ContributionStatus =
  | 'PENDING'
  | 'PENDING_VERIFICATION'
  | 'CONFIRMED'
  | 'REJECTED'
```

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/gift-pools` | required | List all gift pools |
| `POST` | `/api/gift-pools` | required | Create a gift pool |
| `GET` | `/api/gift-pools/:id` | required | Get a single pool |
| `PUT` | `/api/gift-pools/:id` | owner/admin | Update pool details |
| `GET` | `/api/gift-pools/by-event/:eventId` | required | Get pool for a specific event |
| `POST` | `/api/gift-pools/:id/contribute` | required | Submit a contribution |
| `GET` | `/api/gift-pools/:id/pending-contributions` | admin | List pending contributions |
| `POST` | `/api/gift-pools/:id/approve-contribution` | admin | Approve a contribution |
| `POST` | `/api/gift-pools/:id/reject-contribution` | admin | Reject a contribution |
| `POST` | `/api/gift-pools/:id/confirm-received` | birthday user/admin | Confirm gift received |

---

## Creating a Gift Pool

**Frontend files:**
- `FrontEnd/src/features/gifts/components/GiftPoolWidget.tsx`
- `FrontEnd/src/features/gifts/hooks/useGifts.ts`
- `FrontEnd/src/features/gifts/api/gifts.api.ts`

**Backend files:**
- `BackEnd/api/gift-pools/index.ts`
- `BackEnd/src/services/giftPool.service.ts`

**Flow:**
1. A family member opens an event and clicks "Create Gift Pool"
2. Fills in `targetAmount`, optional `giftDescription`
3. Pool is created with `status: 'open'`, linked to the event via `eventId`
4. Pool widget appears on the event detail page for all family members

---

## Contributing to a Pool

**Frontend file:** `FrontEnd/src/features/gifts/components/ContributeForm.tsx`

**Flow:**
1. Member clicks "Contribute" on the pool widget
2. Fills in `amount`, `paymentMethod`, optional `reference` and `note`
3. `POST /api/gift-pools/:id/contribute` — contribution saved with `status: 'PENDING'`
4. Admin is notified to verify the payment (`contribution_pending`)
5. Contribution status transitions to `PENDING_VERIFICATION` once the admin views it

---

## Admin Verification Workflow

**Endpoint:** `POST /api/gift-pools/:id/approve-contribution`  
**Endpoint:** `POST /api/gift-pools/:id/reject-contribution`

1. Admin sees pending contributions on the admin dashboard or event page
2. Checks bank statement / receipt against the `reference` field
3. **Approve:** status → `CONFIRMED`, `verifiedBy` and `verifiedAt` set, contributor notified (`contribution_verified`)
4. **Reject:** status → `REJECTED`, `rejectionReason` saved, contributor notified (`contribution_rejected`)

An audit log entry is written for every verification action.

---

## Confirming Gift Receipt

**Endpoint:** `POST /api/gift-pools/:id/confirm-received`

Once the gift is purchased and delivered, the birthday person (or admin) confirms receipt:
- Pool `status` → `'closed'`
- `receivedAt`, `confirmedBy` fields set
- Pool widget shows a "Gift received" badge

---

## Progress Tracking

The `GiftPoolWidget` component computes progress from the list of `CONFIRMED` contributions:

```
confirmedTotal = sum of contribution.amount where status === 'CONFIRMED'
progress = confirmedTotal / pool.targetAmount * 100
```

The widget shows a progress bar, the confirmed total, and the target amount.
