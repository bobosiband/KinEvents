import type { User } from '@/features/auth/types/auth.types'

export type PaymentMethod = 'bank_transfer' | 'cash' | 'paypal' | 'other'

export interface GiftPool {
  id: string
  eventId: string
  birthdayUserId: string
  targetAmount?: number
  currency: string
  status: 'open' | 'closed'
  createdBy: string
  createdAt: string
  updatedAt: string
  receivedAt?: string
  confirmedBy?: string
  giftDescription?: string
}

export interface GiftContribution {
  id: string
  poolId: string
  paidBy: string
  onBehalfOf: string[]
  amount: number
  paymentMethod?: PaymentMethod
  reference?: string
  note?: string
  createdAt: string
}

export interface GiftPoolStatus {
  pool: GiftPool
  contributions: GiftContribution[]
  totalRaised: number
  contributorIds: string[]
  nonContributors: User[]
}

export interface ContributePayload {
  onBehalfOf: string[]
  amount: number
  paymentMethod?: PaymentMethod
  reference?: string
  note?: string
}

export interface ConfirmReceivedPayload {
  giftDescription?: string
}
