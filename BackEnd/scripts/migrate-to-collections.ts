/* eslint-disable no-console */
import { MongoClient } from 'mongodb'

/**
 * One-shot migration: copies every sub-array from the legacy
 * datastore/appdata document into typed collections under the
 * kinevents_v2 database. Never writes to the legacy database.
 *
 * Usage:
 *   ts-node scripts/migrate-to-collections.ts --dry-run
 *   ts-node scripts/migrate-to-collections.ts --resync
 *   ts-node scripts/migrate-to-collections.ts --verify
 *
 * All modes are idempotent: --resync upserts by id, --verify only reads.
 */

interface CollectionPlan {
  readonly name: string
  readonly sourceField: string
}

const COLLECTIONS: readonly CollectionPlan[] = [
  { name: 'users', sourceField: 'users' },
  { name: 'events', sourceField: 'events' },
  { name: 'accessRequests', sourceField: 'accessRequests' },
  { name: 'accessRequestHistory', sourceField: 'accessRequestHistory' },
  { name: 'notifications', sourceField: 'notifications' },
  { name: 'messages', sourceField: 'messages' },
  { name: 'giftPools', sourceField: 'giftPools' },
  { name: 'giftContributions', sourceField: 'giftContributions' },
  { name: 'auditLogs', sourceField: 'auditLogs' },
  { name: 'content', sourceField: 'content' },
]

type Mode = 'dry-run' | 'resync' | 'verify'

function readMode(): Mode {
  const args = process.argv.slice(2)
  if (args.includes('--dry-run')) return 'dry-run'
  if (args.includes('--resync')) return 'resync'
  if (args.includes('--verify')) return 'verify'
  throw new Error('Pass one of: --dry-run, --resync, --verify')
}

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI?.trim()
  if (!uri) throw new Error('MONGODB_URI not set')
  const sourceDbName = (process.env.MONGODB_DB_NAME ?? 'kinevents').trim()
  const targetDbName = `${sourceDbName}_v2`
  const mode = readMode()

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 })
  await client.connect()

  try {
    const sourceDb = client.db(sourceDbName)
    const targetDb = client.db(targetDbName)

    console.log(`[MIGRATE] mode=${mode} source=${sourceDbName} target=${targetDbName}`)

    const legacyDoc = await sourceDb.collection('datastore').findOne({ name: 'appdata' })
    if (!legacyDoc) {
      console.log('[MIGRATE] No legacy appdata document found — nothing to migrate.')
      return
    }
    const data = (legacyDoc.data ?? {}) as Record<string, readonly { id?: string }[]>

    const report: Record<string, { source: number; target: number; missing: readonly string[] }> = {}

    for (const plan of COLLECTIONS) {
      const sourceRows = Array.isArray(data[plan.sourceField]) ? data[plan.sourceField]! : []
      const sourceCount = sourceRows.length

      if (mode === 'resync') {
        let upserted = 0
        for (const row of sourceRows) {
          if (!row?.id) continue
          const now = new Date().toISOString()
          await targetDb.collection(plan.name).updateOne(
            { id: row.id },
            {
              $set: { ...row, updatedAt: (row as { updatedAt?: string }).updatedAt ?? now },
              $setOnInsert: { createdAt: (row as { createdAt?: string }).createdAt ?? now },
            },
            { upsert: true },
          )
          upserted += 1
        }
        console.log(`[MIGRATE] ${plan.name}: upserted ${upserted}`)
      }

      const targetCount = await targetDb.collection(plan.name).countDocuments()
      const targetIds = new Set<string>(
        (await targetDb.collection(plan.name).find({}, { projection: { id: 1 } }).toArray()).map((d) => d.id as string),
      )
      const missing: string[] = []
      for (const row of sourceRows) {
        if (row?.id && !targetIds.has(row.id)) missing.push(row.id)
      }
      report[plan.name] = { source: sourceCount, target: targetCount, missing }
      const status = missing.length === 0 ? 'OK' : `MISSING ${missing.length}`
      console.log(`[MIGRATE] ${plan.name}: source=${sourceCount} target=${targetCount} ${status}`)
    }

    if (mode === 'verify' || mode === 'resync') {
      const usersMissing = report['users']?.missing.length ?? 0
      if (usersMissing > 0) {
        throw new Error(`[VERIFY FAIL] ${usersMissing} user id(s) missing in kinevents_v2 — never delete a user.`)
      }
    }

    if (mode === 'dry-run') {
      console.log('[MIGRATE] Dry run complete — no writes performed.')
    }
    console.log(JSON.stringify(report, null, 2))
  } finally {
    await client.close()
  }
}

main().catch((err) => {
  console.error('[MIGRATE] FAILED:', err)
  process.exit(1)
})
