import { z } from 'zod'
import type { VercelResponse } from '@vercel/node'

import { contentService } from '../../src/services/content.service'
import { withAuth, type RequestWithUser } from '../../src/middleware/withAuth'

const upsertContentSchema = z.object({
  key: z.enum(['homepage_title', 'homepage_subtitle', 'homepage_image_url', 'announcement']),
  value: z.string(),
  updatedBy: z.string().uuid(),
})

/**
 * Returns or updates the site content blocks used by the admin area.
 * @param req Incoming request object with authenticated user.
 * @param res Vercel response object.
 */
function handler(req: RequestWithUser, res: VercelResponse) {
  if (req.method === 'GET') {
    const content = contentService.listContent()
    res.status(200).json({ success: true, data: content })
  } else if (req.method === 'POST' || req.method === 'PUT') {
    const parseResult = upsertContentSchema.safeParse(req.body)
    if (!parseResult.success) {
      res.status(400).json({ success: false, message: 'Validation failed', details: parseResult.error.flatten() })
      return
    }

    try {
      const content = contentService.upsertContent(parseResult.data.key, parseResult.data.value, parseResult.data.updatedBy)
      res.status(201).json({
        success: true,
        data: content,
        message: 'Content updated successfully',
      })
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message })
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' })
  }
}

export default withAuth(handler, 'admin')
