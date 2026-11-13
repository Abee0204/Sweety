import { createContext } from 'react'
import type { AuthSession, AuthStatus, Page, Reading, ReadingsStatus } from '../types'

export interface AppContextValue {
  page: Page
  setPage: (page: Page) => void
  readings: Reading[]
  setReadings: (update: (readings: Reading[]) => Reading[]) => void
  readingsStatus: ReadingsStatus
  readingsError: string | null
  retryReadings: () => void
  reportDate: string
  setReportDate: (date: string) => void
  reportMonth: string
  setReportMonth: (month: string) => void
  authSession: AuthSession | null
  authToken: string | null
  authStatus: AuthStatus
  authError: string | null
  setAuthSession: (session: AuthSession | null) => void
  logout: () => void
  toast: string
  showToast: (message: string) => void
  clearToast: () => void
}

export const AppContext = createContext<AppContextValue | null>(null)
