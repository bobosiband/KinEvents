import { readData } from '../config/db'
import type { IUser } from '../interfaces/user.interface'
import type { IUserStore } from './IStore'

export class LegacyDocumentUserStore implements IUserStore {
  public async findAll(): Promise<readonly IUser[]> {
    const db = await readData()
    return db.users.filter((u) => !(u as unknown as { deletedAt?: string }).deletedAt)
  }

  public async findById(id: string): Promise<IUser | null> {
    const db = await readData()
    const user = db.users.find((u) => u.id === id)
    if (!user) return null
    if ((user as unknown as { deletedAt?: string }).deletedAt) return null
    return user
  }

  public async findByEmail(email: string): Promise<IUser | null> {
    const db = await readData()
    const normalized = email.trim().toLowerCase()
    const user = db.users.find((u) => u.email.trim().toLowerCase() === normalized)
    if (!user) return null
    if ((user as unknown as { deletedAt?: string }).deletedAt) return null
    return user
  }
}
