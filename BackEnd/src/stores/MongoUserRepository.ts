import type { IUser } from '../interfaces/user.interface'
import { BaseRepository, type IIndexSpec, type ISoftDeletable } from '../db/BaseRepository'
import type { IUserStore } from './IStore'

type IUserRow = IUser & ISoftDeletable

export class MongoUserRepository extends BaseRepository<IUserRow> implements IUserStore {
  protected readonly collectionName: string = 'users'
  protected readonly indexes: readonly IIndexSpec[] = [
    { spec: { email: 1 }, options: { unique: true } },
    { spec: { role: 1 } },
    { spec: { deletedAt: 1 } },
  ]

  public async findAll(): Promise<readonly IUser[]> {
    return this.findMany({})
  }

  public async findByEmail(email: string): Promise<IUser | null> {
    return this.findOne({ email: email.trim().toLowerCase() })
  }
}
