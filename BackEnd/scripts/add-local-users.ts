import { randomUUID } from 'crypto'
import { dbReady } from '../src/config/db'
import { userRepository } from '../src/repositories/user.repository'
import type { IUser } from '../src/interfaces/user.interface'

async function main() {
  await dbReady

  const now = new Date().toISOString()

  const sampleUsers: IUser[] = [
    {
      id: randomUUID(),
      name: 'Alice Local',
      email: 'alice.local@example.com',
      role: 'member',
      accessStatus: 'approved',
      capabilities: [],
      notificationPrefs: { level: 'all', channels: ['email'] },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      name: 'Bob Local',
      email: 'bob.local@example.com',
      role: 'admin',
      accessStatus: 'approved',
      capabilities: [],
      notificationPrefs: { level: 'all', channels: ['email'] },
      createdAt: now,
      updatedAt: now,
    },
  ]

  for (const u of sampleUsers) {
    const inserted = await userRepository.insert(u)
    // eslint-disable-next-line no-console
    console.log('Inserted:', inserted.email)
  }

  // eslint-disable-next-line no-console
  console.log('Current users in local store:', userRepository.findAll().map((x) => x.email))
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})
