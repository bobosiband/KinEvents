export interface ISharedList {
  id: string
  eventId: string
  title: string
  createdBy: string
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

export interface ISharedListItem {
  id: string
  listId: string
  name: string
  quantity: number
  notes?: string
  claimedBy?: string
  claimedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}
