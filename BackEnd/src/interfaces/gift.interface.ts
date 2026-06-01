export interface IGiftPool {
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

export interface IGiftContribution {
  id: string
  poolId: string
  paidBy: string
  onBehalfOf: string[]
  amount: number
  paymentMethod?: 'bank_transfer' | 'cash' | 'paypal' | 'other'
  reference?: string
  note?: string
  createdAt: string
  // Verification workflow
  status?: 'PENDING' | 'PENDING_VERIFICATION' | 'CONFIRMED' | 'REJECTED'
  submittedAt?: string
  verifiedBy?: string
  verifiedAt?: string
  rejectedBy?: string
  rejectedAt?: string
  rejectionReason?: string
}
