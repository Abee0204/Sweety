import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { apiRequest, ApiError } from '../api/client'
import { createInitialReadings } from '../data/mockData'
import type { AuthSession, AuthStatus, AuthUser, Page, Reading } from '../types'
import { today } from '../utils/dates'
import { AppContext } from './context'

const AUTH_TOKEN_STORAGE_KEY = 'sweety.auth.token'
const STORAGE_RESTORE_ERROR = 'Could not access this tab’s saved session. Sign in again to continue.'

interface RestoreSeed {
  token: string | null
  storageError: boolean
}

interface CurrentUserResponse {
  success: boolean
  data: AuthUser & { createdAt: string }
}

const isAuthPage = (page: Page) => page === 'login' || page === 'register'

const isAuthUser = (value: unknown): value is AuthUser =>
  typeof value === 'object' && value !== null &&
  'id' in value && typeof value.id === 'string' &&
  'name' in value && typeof value.name === 'string' &&
  'email' in value && typeof value.email === 'string'

export function AppProvider({ children }: { children: ReactNode }) {
  const [restoreSeed] = useState<RestoreSeed>(() => {
    try {
      return { token: window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY), storageError: false }
    } catch {
      return { token: null, storageError: true }
    }
  })
  const [page, setPageState] = useState<Page>(() => restoreSeed.token ? 'dashboard' : 'login')
  const [readings, setReadingState] = useState<Reading[]>(createInitialReadings)
  const [reportDate, setReportDate] = useState(today())
  const [reportMonth, setReportMonth] = useState(today().slice(0, 7))
  const [authSession, setAuthSessionState] = useState<AuthSession | null>(null)
  const [restoringToken, setRestoringToken] = useState<string | null>(restoreSeed.token)
  const [authStatus, setAuthStatus] = useState<AuthStatus>(
    restoreSeed.storageError ? 'restore-error' : restoreSeed.token ? 'loading' : 'anonymous',
  )
  const [authError, setAuthError] = useState<string | null>(
    restoreSeed.storageError ? STORAGE_RESTORE_ERROR : null,
  )
  const [toast, setToast] = useState('')
  const restoreStarted = useRef(false)
  const authRevision = useRef(0)
  const initialAuthRevision = useRef(0)
  const isAuthenticated = authStatus === 'authenticated' && authSession !== null

  const setPage = useCallback((nextPage: Page) => {
    if (!isAuthenticated && !isAuthPage(nextPage)) {
      setPageState('login')
      return
    }
    if (isAuthenticated && isAuthPage(nextPage)) {
      setPageState('dashboard')
      return
    }
    setPageState(nextPage)
  }, [isAuthenticated])
  const setReadings = useCallback((update: (current: Reading[]) => Reading[]) => setReadingState(update), [])
  const showToast = useCallback((message: string) => {
    setToast(message)
    window.setTimeout(() => setToast((current) => current === message ? '' : current), 3500)
  }, [])
  const clearToast = useCallback(() => setToast(''), [])

  const setAuthSession = useCallback((session: AuthSession | null) => {
    authRevision.current += 1
    setAuthSessionState(session)
    setRestoringToken(null)
    setAuthStatus(session ? 'authenticated' : 'anonymous')
    setAuthError(null)
    setPageState(session ? 'dashboard' : 'login')

    try {
      if (session) {
        window.sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, session.token)
      } else {
        window.sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
      }
    } catch {
      const message = session
        ? 'You are signed in for this tab, but the session could not be saved for refresh.'
        : 'You are signed out, but the saved session could not be cleared.'
      setAuthError(message)
      showToast(message)
    }
  }, [showToast])

  const logout = useCallback(() => {
    setAuthSession(null)
  }, [setAuthSession])

  useEffect(() => {
    if (restoreStarted.current) return
    restoreStarted.current = true
    const revision = initialAuthRevision.current
    if (authRevision.current !== revision) return
    if (restoreSeed.storageError) {
      window.setTimeout(() => showToast(STORAGE_RESTORE_ERROR), 0)
      return
    }

    const token = restoreSeed.token
    if (!token) return
    void apiRequest<CurrentUserResponse>('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    }).then((response) => {
      if (authRevision.current !== revision) return
      if (!isAuthUser(response?.data)) {
        throw new Error('The server returned an incomplete current-user response.')
      }

      setAuthSessionState({ user: response.data, token })
      setRestoringToken(null)
      setAuthStatus('authenticated')
      setAuthError(null)
      setPageState((currentPage) => isAuthPage(currentPage) ? 'dashboard' : currentPage)
    }).catch((error: unknown) => {
      if (authRevision.current !== revision) return

      if (error instanceof ApiError && [401, 403, 404].includes(error.status)) {
        setAuthSession(null)
        return
      }

      const message = 'Could not verify your saved session. Check your connection and reload to retry.'
      setAuthStatus('restore-error')
      setAuthError(message)
      setPageState('login')
      showToast(message)
    })
  }, [restoreSeed, setAuthSession, showToast])

  const authToken = authSession?.token ?? restoringToken
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
    authToken,
    authStatus,
    authError,
    setAuthSession,
    logout,
    toast,
    showToast,
    clearToast,
  }), [page, setPage, readings, setReadings, reportDate, reportMonth, authSession, authToken, authStatus, authError, setAuthSession, logout, toast, showToast, clearToast])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
