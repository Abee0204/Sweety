import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { createInitialReadings } from '../data/mockData'
import type { AuthSession, Page, Reading } from '../types'
import { today } from '../utils/dates'
import { AppContext } from './context'

export function AppProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<Page>('dashboard')
  const [readings, setReadingState] = useState<Reading[]>(createInitialReadings)
  const [reportDate, setReportDate] = useState(today())
  const [reportMonth, setReportMonth] = useState(today().slice(0, 7))
  const [authSession, setAuthSessionState] = useState<AuthSession | null>(null)
  const [toast, setToast] = useState('')

  const setReadings = useCallback((update: (current: Reading[]) => Reading[]) => setReadingState(update), [])
  const setAuthSession = useCallback((session: AuthSession | null) => setAuthSessionState(session), [])
  const showToast = useCallback((message: string) => {
    setToast(message)
    window.setTimeout(() => setToast((current) => current === message ? '' : current), 3500)
  }, [])
  const clearToast = useCallback(() => setToast(''), [])
  const value = useMemo(() => ({
    page,
    setPage,
    readings,
    setReadings,
    reportDate,
    setReportDate,
    reportMonth,
    setReportMonth,
    authSession,
    setAuthSession,
    toast,
    showToast,
    clearToast,
  }), [page, readings, setReadings, reportDate, reportMonth, authSession, setAuthSession, toast, showToast, clearToast])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
