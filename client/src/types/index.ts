export type ReadingUnit = 'mg/dL' | 'mmol/L'
export type ReadingType = 'Fasting' | 'Before Meal' | 'After Meal' | 'Dinner'
export type AuthStatus = 'loading' | 'anonymous' | 'authenticated' | 'restore-error'
export type ReadingsStatus = 'idle' | 'loading' | 'loaded' | 'error'

export interface Reading {
  id: number | string
  value: number
  unit: ReadingUnit
  type: ReadingType
  date: string
  time: string
  recordedAt?: string
}

export interface AuthUser {
  id: string
  name: string
  email: string
}

export interface AuthSession {
  user: AuthUser
  token: string
}
