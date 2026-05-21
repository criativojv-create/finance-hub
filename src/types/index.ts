export type Payer = 'person1' | 'person2' | 'both'

export interface Category {
  id: string
  name: string
  color: string
  icon: string
  isCustom?: boolean
}

export interface Expense {
  id: string
  description: string
  amount: number
  date: string
  categoryId: string
  payer: Payer
  createdAt: string
  // Parcelamento
  installments?: number
  installmentNumber?: number
  installmentGroupId?: string
}

export interface FixedExpense {
  id: string
  description: string
  amount: number
  categoryId: string
  payer: Payer
  dayOfMonth: number
  active: boolean
  startYear: number
  startMonth: number
  createdAt: string
}

export type BusinessType = 'service' | 'product'
export type BusinessStatus = 'paid' | 'pending' | 'overdue'

export interface BusinessEntry {
  id: string
  description: string
  type: BusinessType
  amount: number
  date: string
  client: string
  status: BusinessStatus
  createdAt: string
}

export interface PersonNames {
  person1: string
  person2: string
}
