import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db, dbReady } from '../../src/config/db'

/**
 * Debug endpoint that returns the current state of the database layer.
 * Useful for diagnosing initialization, adapter switching, and data loading issues.
 *
 * Example usage:
 *   GET http://localhost:3000/api/debug/db
 *
 * Response:
 *   {
 *     "adapter": "mongo",
 *     "ready": true,
 *     "collections": {
 *       "users": 4,
 *       "events": 2,
 *       "accessRequests": 0,
 *       "notifications": 0,
 *       "content": 0
 *     },
 *     "userEmails": ["alice@example.com", "bob@example.com", ...],
 *     "environment": {
 *       "nodeEnv": "development",
 *       "mongoUriConfigured": true,
 *       "mongoFallbackAllowed": true
 *     }
 *   }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }

  try {
    // Check if database is ready
    const readyPromise = Promise.race([
      dbReady,
      new Promise<string>((resolve) =>
        setTimeout(() => resolve('timeout'), 2000)
      ),
    ])

    const readyResult = await readyPromise

    const isReady = readyResult !== 'timeout'

    const adapterType = (db as any).getAdapterType?.() || 'unknown'

    res.status(200).json({
      success: true,
      data: {
        adapter: adapterType,
        ready: isReady,
        collections: {
          users: db.data.users.length,
          events: db.data.events.length,
          accessRequests: db.data.accessRequests.length,
          notifications: db.data.notifications.length,
          content: db.data.content.length,
        },
        userEmails: db.data.users.map((u) => u.email),
        userDetails: db.data.users.map((u) => ({
          id: u.id,
          email: u.email,
          role: u.role,
          accessStatus: u.accessStatus,
        })),
        environment: {
          nodeEnv: process.env.NODE_ENV,
          mongoUriConfigured: Boolean(process.env.MONGODB_URI?.trim()),
          jsonFallbackAllowed:
            process.env.NODE_ENV === 'development' ||
            Boolean(process.env.LOCAL_DB_PATH?.trim()) ||
            process.env.AWS_SAM_LOCAL === 'true',
        },
        timestamp: new Date().toISOString(),
      },
      message: 'Database state retrieved successfully',
    })
  } catch (error) {
    console.error('[DEBUG/DB] Error:', error)

    res.status(500).json({
      success: false,
      message: (error as Error).message || 'Internal server error',
      data: {
        adapter: (db as any).getAdapterType?.() || 'unknown',
      },
    })
  }
}
