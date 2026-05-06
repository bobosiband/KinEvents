export type EventType = 'birthday' | 'custom'

export type RSVPStatus = 'yes' | 'no' | 'maybe'

export interface IEvent {
  id: string
  title: string
  description: string
  date: string
  location?: string
  onlineLink?: string
  imageUrl?: string
  type: EventType
  locked: boolean
  createdBy: string
  rsvps: Record<string, RSVPStatus>
  createdAt: string
  updatedAt: string
}