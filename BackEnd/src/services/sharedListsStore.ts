import { randomUUID } from 'crypto'
import type { ISharedList, ISharedListItem } from '../interfaces/sharedList.interface'

export interface ICreateListInput {
  readonly eventId: string
  readonly title: string
  readonly createdBy: string
}

export interface IAddItemInput {
  readonly listId: string
  readonly name: string
  readonly quantity?: number
  readonly notes?: string
}

class SharedListsStore {
  private readonly lists: ISharedList[] = []
  private readonly items: ISharedListItem[] = []

  public createList(input: ICreateListInput): ISharedList {
    const now = new Date().toISOString()
    const list: ISharedList = {
      id: randomUUID(),
      eventId: input.eventId,
      title: input.title,
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    }
    this.lists.push(list)
    return list
  }

  public listsForEvent(eventId: string): readonly ISharedList[] {
    return this.lists.filter((l) => l.eventId === eventId && !l.deletedAt)
  }

  public addItem(input: IAddItemInput): ISharedListItem | null {
    const list = this.lists.find((l) => l.id === input.listId && !l.deletedAt)
    if (!list) return null
    const now = new Date().toISOString()
    const item: ISharedListItem = {
      id: randomUUID(),
      listId: input.listId,
      name: input.name,
      quantity: input.quantity ?? 1,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    }
    this.items.push(item)
    return item
  }

  public itemsForList(listId: string): readonly ISharedListItem[] {
    return this.items.filter((i) => i.listId === listId && !i.deletedAt)
  }

  public claim(itemId: string, userId: string): ISharedListItem | null {
    const item = this.items.find((i) => i.id === itemId && !i.deletedAt)
    if (!item) return null
    if (item.claimedBy && item.claimedBy !== userId) return null
    const now = new Date().toISOString()
    item.claimedBy = userId
    item.claimedAt = now
    item.updatedAt = now
    return item
  }

  public release(itemId: string, userId: string): ISharedListItem | null {
    const item = this.items.find((i) => i.id === itemId && !i.deletedAt)
    if (!item) return null
    if (item.claimedBy !== userId) return null
    const now = new Date().toISOString()
    delete item.claimedBy
    delete item.claimedAt
    item.updatedAt = now
    return item
  }

  public resetForTesting(): void {
    this.lists.splice(0, this.lists.length)
    this.items.splice(0, this.items.length)
  }
}

export const sharedListsStore: SharedListsStore = new SharedListsStore()
