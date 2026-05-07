import { db, dbReady } from './src/config/db'

async function main() {
  await dbReady
  console.log('Database type:', db.constructor.name)
  console.log('Users in db:', db.data?.users?.length)
  console.log('Users:', db.data?.users?.map((u: any) => u.email))
}

main().catch(console.error)
