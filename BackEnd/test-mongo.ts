import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI

async function test() {
  console.log('Testing MongoDB connection...')
  console.log('URI:', uri?.substring(0, 40) + '...')

  const client = new MongoClient(uri!)

  try {
    await client.connect()
    console.log('✓ MongoDB connected successfully')

    const db = client.db('kinevents')
    const users = await db.collection('users').find({}).toArray()
    console.log('Users in MongoDB:', users.length)
    console.log('Emails:', users.map((u) => u.email))

    await client.close()
  } catch (err: any) {
    console.error('✗ Connection failed:', err.message)
    process.exit(1)
  }
}

test().then(() => process.exit(0))
