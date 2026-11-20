import { featureFlags } from '../config/FeatureFlags'
import { MongoConnection } from '../db/MongoConnection'
import { LegacyDocumentEventStore } from './LegacyDocumentEventStore'
import { LegacyDocumentUserStore } from './LegacyDocumentUserStore'
import { MongoEventRepository } from './MongoEventRepository'
import { MongoUserRepository } from './MongoUserRepository'
import type { IEventStore, IUserStore } from './IStore'

/**
 * Picks the concrete store implementation based on featureFlags.useCollections.
 * With the flag off (tonight), callers get the LegacyDocument* wrappers so
 * reads / writes land on the single-document datastore exactly as before.
 * When the owner flips the flag after running the migration, the same
 * callers transparently start reading from kinevents_v2.
 */
export class StoreFactory {
  private static userStore: IUserStore | null = null
  private static eventStore: IEventStore | null = null

  public static users(): IUserStore {
    if (!StoreFactory.userStore) {
      StoreFactory.userStore = featureFlags.useCollections
        ? new MongoUserRepository(MongoConnection.get())
        : new LegacyDocumentUserStore()
    }
    return StoreFactory.userStore
  }

  public static events(): IEventStore {
    if (!StoreFactory.eventStore) {
      StoreFactory.eventStore = featureFlags.useCollections
        ? new MongoEventRepository(MongoConnection.get())
        : new LegacyDocumentEventStore()
    }
    return StoreFactory.eventStore
  }

  public static resetForTesting(): void {
    StoreFactory.userStore = null
    StoreFactory.eventStore = null
  }
}
