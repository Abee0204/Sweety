export type Page = 'dashboard' | 'daily-report' | 'monthly-report' | 'add' | 'login' | 'register'
export type ReadingUnit = 'mg/dL' | 'mmol/L'
export type ReadingType = 'Fasting' | 'Before Meal' | 'After Meal' | 'Dinner'
export type AuthStatus = 'loading' | 'anonymous' | 'authenticated' | 'restore-error'

export interface Reading {
  id: number
  value: number
  unit: ReadingUnit
  type: ReadingType
  date: string
  time: string
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
