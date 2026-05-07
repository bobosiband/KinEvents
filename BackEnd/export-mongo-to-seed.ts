import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://bobosibanda35_db_user:udYo0FNETvETuRpG@database.wnsx0tq.mongodb.net/?appName=dataBase'
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'kinevents'

async function exportData() {
  const client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  })

  try {
    console.log('[EXPORT] Connecting to MongoDB...')
    await client.connect()
    console.log('[EXPORT] ✓ Connected')

    const db = client.db(MONGODB_DB_NAME)

    // Export all collections
    const collections = ['users', 'events', 'accessRequests', 'notifications', 'content']
    const data: any = {}

    for (const collectionName of collections) {
      const docs = await db.collection(collectionName).find({}).toArray()
      data[collectionName] = docs
      console.log(`[EXPORT] ${collectionName}: ${docs.length} documents`)
    }

    // Save to seed file
    const fs = require('fs')
    const path = require('path')
    const seedPath = path.join(__dirname, 'data', 'db.json')
    
    fs.mkdirSync(path.dirname(seedPath), { recursive: true })
    fs.writeFileSync(seedPath, JSON.stringify(data, null, 2) + '\n')

    console.log(`\n[EXPORT] ✓ Exported to ${seedPath}`)
    console.log('[EXPORT] Summary:', {
      users: data.users?.length || 0,
      events: data.events?.length || 0,
      accessRequests: data.accessRequests?.length || 0,
      notifications: data.notifications?.length || 0,
      content: data.content?.length || 0,
    })
  } finally {
    await client.close()
  }
}

exportData().catch(err => {
  console.error('[EXPORT] Error:', err.message)
  process.exit(1)
})
