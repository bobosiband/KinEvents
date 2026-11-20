import type { IEvent } from '../interfaces/event.interface'
import { BaseRepository, type IIndexSpec, type ISoftDeletable } from '../db/BaseRepository'
import type { IEventStore } from './IStore'

type IEventRow = IEvent & ISoftDeletable

export class MongoEventRepository extends BaseRepository<IEventRow> implements IEventStore {
  protected readonly collectionName: string = 'events'
  protected readonly indexes: readonly IIndexSpec[] = [
    { spec: { date: 1 } },
    { spec: { type: 1 } },
    { spec: { createdBy: 1 } },
    { spec: { deletedAt: 1 } },
  ]

  public async findAll(): Promise<readonly IEvent[]> {
    return this.findMany({})
  }
}
