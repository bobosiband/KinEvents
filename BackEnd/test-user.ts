import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI

async function test() {
  const client = new MongoClient(uri!)

  try {
    await client.connect()
    const db = client.db('kinevents')
    const user = await db.collection('users').findOne({ email: 'bob.local@example.com' })
    console.log('User found:')
    console.log(JSON.stringify(user, null, 2))
    await client.close()
    process.exit(0)
  } catch (e: any) {
    console.error(e.message)
    process.exit(1)
  }
}

test()
setTimeout(() => process.exit(1), 15000)
