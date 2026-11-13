import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { apiRequest, ApiError } from '../api/client'
import { getReadings, toFrontendReading } from '../features/readings/api'
import type { AuthSession, AuthStatus, AuthUser, Reading, ReadingsStatus } from '../types'
import { utcToday } from '../utils/dates'
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

const isAuthUser = (value: unknown): value is AuthUser =>
  typeof value === 'object' && value !== null &&
  'id' in value && typeof value.id === 'string' &&
  'name' in value && typeof value.name === 'string' &&
  'email' in value && typeof value.email === 'string'

function mergeReadings(current: Reading[], fetched: Reading[]): Reading[] {
  const byId = new Map(fetched.map((reading) => [String(reading.id), reading]))
  for (const reading of current) {
    if (!byId.has(String(reading.id))) byId.set(String(reading.id), reading)
  }

  return [...byId.values()].sort((left, right) => {
    const leftTime = left.recordedAt ? Date.parse(left.recordedAt) : Date.parse(`${left.date}T${left.time}`)
    const rightTime = right.recordedAt ? Date.parse(right.recordedAt) : Date.parse(`${right.date}T${right.time}`)
    return rightTime - leftTime
  })
}

function getReadingsErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 401) {
    return 'Your session expired. Sign in again to load your readings.'
  }
  if (error instanceof ApiError) return error.message
  return 'Could not load your readings. Check your connection and try again.'
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [restoreSeed] = useState<RestoreSeed>(() => {
    try {
      return { token: window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY), storageError: false }
    } catch {
      return { token: null, storageError: true }
    }
  })
  const [readings, setReadingState] = useState<Reading[]>([])
  const [readingsStatus, setReadingsStatus] = useState<ReadingsStatus>('idle')
  const [readingsError, setReadingsError] = useState<string | null>(null)
  const [readingsRetry, setReadingsRetry] = useState(0)
  const [initialUtcDate] = useState(() => utcToday())
  const [reportDate, setReportDate] = useState(initialUtcDate)
  const [reportMonth, setReportMonth] = useState(initialUtcDate.slice(0, 7))
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
  const readingRequests = useRef(new Map<string, Promise<Reading[]>>())
  const setReadings = useCallback((update: (current: Reading[]) => Reading[]) => setReadingState(update), [])
  const retryReadings = useCallback(() => {
    setReadingsStatus('loading')
    setReadingsError(null)
    setReadingsRetry((count) => count + 1)
  }, [])
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
    setReadingState([])
    setReadingsStatus(session ? 'loading' : 'idle')
    setReadingsError(null)
    if (session) setReadingsRetry((count) => count + 1)

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
      setReadingsStatus('loading')
      setReadingsError(null)
      setAuthError(null)
    }).catch((error: unknown) => {
      if (authRevision.current !== revision) return

      if (error instanceof ApiError && [401, 403, 404].includes(error.status)) {
        setAuthSession(null)
        return
      }

      const message = 'Could not verify your saved session. Check your connection and reload to retry.'
      setAuthStatus('restore-error')
      setAuthError(message)
      showToast(message)
    })
  }, [restoreSeed, setAuthSession, showToast])

  useEffect(() => {
    const token = authStatus === 'authenticated' ? authSession?.token : null
    if (!token) return

    let active = true
    let request = readingRequests.current.get(token)
    if (!request) {
      request = getReadings(token).then((response) => {
        if (!response?.success || !Array.isArray(response.data)) {
          throw new Error('The server returned an invalid readings response.')
        }
        return response.data.map(toFrontendReading)
      })
      readingRequests.current.set(token, request)
      void request.finally(() => {
        if (readingRequests.current.get(token) === request) readingRequests.current.delete(token)
      }).catch(() => undefined)
    }

    void request.then((fetched) => {
      if (!active) return
      setReadingState((current) => mergeReadings(current, fetched))
      setReadingsStatus('loaded')
      setReadingsError(null)
    }).catch((error: unknown) => {
      if (!active) return
      setReadingsStatus('error')
      setReadingsError(getReadingsErrorMessage(error))
    })

    return () => { active = false }
  }, [authStatus, authSession?.token, readingsRetry])

  const authToken = authSession?.token ?? restoringToken
  const value = useMemo(() => ({
    readings,
    setReadings,
    readingsStatus,
    readingsError,
    retryReadings,
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
  }), [readings, setReadings, readingsStatus, readingsError, retryReadings, reportDate, reportMonth, authSession, authToken, authStatus, authError, setAuthSession, logout, toast, showToast, clearToast])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
