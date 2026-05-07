import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI

if (!uri) {
  console.error('missing uri')
  process.exit(1)
}

async function main() {
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  })

  try {
    await client.connect()
    console.log('connected')
    await client.close()
    process.exit(0)
  } catch (err) {
    console.error('connection error:', err instanceof Error ? err.message : String(err))
    process.exit(1)
  }
}

main()
