import { z } from 'zod'
import type { VercelResponse } from '@vercel/node'

import { featureFlags } from '../../src/config/FeatureFlags'
import { withAuth, type RequestWithUser } from '../../src/middleware/withAuth'
import { applyPolicy } from '../../src/middleware/applyPolicy'
import { RolePolicy } from '../../src/auth/policies/RolePolicy'
import { ledgerStore } from '../../src/services/ledgerStore'

const adjustSchema = z.object({
  reversesEntryId: z.string().uuid(),
  amountCents: z.number().int(),
  currency: z.string().min(1).max(10),
  memo: z.string().trim().min(1).max(500),
})

async function handler(req: RequestWithUser, res: VercelResponse): Promise<void> {
  if (!featureFlags.paymentsLedger) {
    res.status(404).json({ success: false, message: 'Payments ledger is disabled' })
    return
  }
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }
  if (!applyPolicy(req, res, new RolePolicy(['admin', 'manager']))) return
  const parse = adjustSchema.safeParse(req.body)
  if (!parse.success) {
    res.status(400).json({ success: false, message: 'Validation failed', details: parse.error.flatten() })
    return
  }
  const entry = ledgerStore.post({
    entryType: 'adjustment',
    amountCents: parse.data.amountCents,
    currency: parse.data.currency,
    memo: parse.data.memo,
    postedBy: req.user!.id,
    reversesEntryId: parse.data.reversesEntryId,
  })
  res.status(201).json({ success: true, data: entry })
}

export default withAuth(handler)
