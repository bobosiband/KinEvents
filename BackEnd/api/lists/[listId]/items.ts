import { z } from 'zod'
import type { VercelResponse } from '@vercel/node'

import { featureFlags } from '../../../src/config/FeatureFlags'
import { withAuth, type RequestWithUser } from '../../../src/middleware/withAuth'
import { applyPolicy } from '../../../src/middleware/applyPolicy'
import { RolePolicy } from '../../../src/auth/policies/RolePolicy'
import { sharedListsStore } from '../../../src/services/sharedListsStore'

const addItemSchema = z.object({
  name: z.string().trim().min(1).max(200),
  quantity: z.number().int().positive().max(1000).optional(),
  notes: z.string().max(500).optional(),
})

async function handler(req: RequestWithUser, res: VercelResponse): Promise<void> {
  if (!featureFlags.sharedLists) {
    res.status(404).json({ success: false, message: 'Shared lists are disabled' })
    return
  }
  const params = (req as unknown as { params?: Record<string, string> }).params ?? {}
  const listId = params.listId ?? (typeof req.query?.listId === 'string' ? req.query.listId : '')
  if (!listId) {
    res.status(400).json({ success: false, message: 'Missing listId' })
    return
  }

  if (req.method === 'GET') {
    res.status(200).json({ success: true, data: sharedListsStore.itemsForList(listId) })
    return
  }
  if (req.method === 'POST') {
    if (!applyPolicy(req, res, new RolePolicy(['admin', 'manager']))) return
    const parse = addItemSchema.safeParse(req.body)
    if (!parse.success) {
      res.status(400).json({ success: false, message: 'Validation failed', details: parse.error.flatten() })
      return
    }
    const item = sharedListsStore.addItem({
      listId,
      name: parse.data.name,
      quantity: parse.data.quantity,
      notes: parse.data.notes,
    })
    if (!item) {
      res.status(404).json({ success: false, message: 'List not found' })
      return
    }
    res.status(201).json({ success: true, data: item })
    return
  }
  res.status(405).json({ success: false, message: 'Method not allowed' })
}

export default withAuth(handler)
