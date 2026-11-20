import { readData } from '../config/db'
import type { IEvent } from '../interfaces/event.interface'
import type { IEventStore } from './IStore'

export class LegacyDocumentEventStore implements IEventStore {
  public async findAll(): Promise<readonly IEvent[]> {
    const db = await readData()
    return db.events.filter((e) => !(e as unknown as { deletedAt?: string }).deletedAt)
  }

  public async findById(id: string): Promise<IEvent | null> {
    const db = await readData()
    const evt = db.events.find((e) => e.id === id)
    if (!evt) return null
    if ((evt as unknown as { deletedAt?: string }).deletedAt) return null
    return evt
  }
}
