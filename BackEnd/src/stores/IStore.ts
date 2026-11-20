import type { IUser } from '../interfaces/user.interface'
import type { IEvent } from '../interfaces/event.interface'

/**
 * Minimal per-entity read interface. Services depend on IUserStore /
 * IEventStore; concrete implementations are LegacyDocumentUserStore
 * (reads from the single-document datastore, exactly as today) and
 * MongoUserRepository (reads from kinevents_v2 via BaseRepository).
 *
 * This file is intentionally lean — more methods land as services get
 * migrated. The point tonight is the seam; the switch is one line in
 * StoreFactory and stays off until the owner flips featureFlags.useCollections.
 */

export interface IUserStore {
  findAll(): Promise<readonly IUser[]>
  findById(id: string): Promise<IUser | null>
  findByEmail(email: string): Promise<IUser | null>
}

export interface IEventStore {
  findAll(): Promise<readonly IEvent[]>
  findById(id: string): Promise<IEvent | null>
}
