import { createContext } from 'react'
import type { AuthSession, Page, Reading } from '../types'

export interface AppContextValue {
  page: Page
  setPage: (page: Page) => void
  readings: Reading[]
  setReadings: (update: (readings: Reading[]) => Reading[]) => void
  reportDate: string
  setReportDate: (date: string) => void
  reportMonth: string
  setReportMonth: (month: string) => void
  authSession: AuthSession | null
  setAuthSession: (session: AuthSession | null) => void
  toast: string
  showToast: (message: string) => void
  clearToast: () => void
}

export const AppContext = createContext<AppContextValue | null>(null)
