import { z } from 'zod'
import type { VercelRequest, VercelResponse } from '@vercel/node'

import { userRepository } from '../../src/repositories/user.repository'

const updateUserSchema = z.object({
  name: z.string().optional(),
  birthday: z.string().optional(),
  notificationPrefs: z.object({
    level: z.enum(['all', 'important', 'none']).optional(),
    channels: z.array(z.enum(['email', 'push'])).optional(),
  }).optional(),
})

/**
 * Retrieves, updates, or deletes a single user by id.
 * @param req Incoming request object.
 * @param res Vercel response object.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  const queryId = req.query?.id
  const paramsId = (req as unknown as { params?: Record<string, unknown> }).params?.id
  const id = typeof queryId === 'string' ? queryId : typeof paramsId === 'string' ? paramsId : undefined

  if (!id) {
    res.status(400).json({ success: false, message: 'Invalid user ID' })
    return
  }

  if (req.method === 'GET') {
    const user = userRepository.findById(id)
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }
    res.status(200).json({ success: true, data: user })
  } else if (req.method === 'PUT' || req.method === 'PATCH') {
    const parseResult = updateUserSchema.safeParse(req.body)
    if (!parseResult.success) {
      res.status(400).json({ success: false, message: 'Validation failed', details: parseResult.error.flatten() })
      return
    }

    const updateData: any = { updatedAt: new Date().toISOString() }
    if (parseResult.data.name) updateData.name = parseResult.data.name
    if (parseResult.data.birthday) updateData.birthday = parseResult.data.birthday
    if (parseResult.data.notificationPrefs) {
      const existing = userRepository.findById(id)
      updateData.notificationPrefs = {
        level: parseResult.data.notificationPrefs.level ?? existing?.notificationPrefs.level,
        channels: parseResult.data.notificationPrefs.channels ?? existing?.notificationPrefs.channels,
      }
    }

    const updatedUser = userRepository.update(id, updateData)

    if (!updatedUser) {
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }

    res.status(200).json({ success: true, data: updatedUser })
  } else if (req.method === 'DELETE') {
    const deleted = userRepository.remove(id)
    if (!deleted) {
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }
    res.status(200).json({ success: true, message: 'User deleted successfully' })
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' })
  }
}
