import { AppLayout } from '../components/layout/AppLayout'
import { useAppContext } from '../context/useAppContext'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { RegisterPage } from '../features/auth/pages/RegisterPage'
import { DashboardPage } from '../features/dashboard/pages/DashboardPage'
import { AddReadingPage } from '../features/readings/pages/AddReadingPage'
import { DailyReportPage } from '../features/reports/pages/DailyReportPage'
import { MonthlyReportPage } from '../features/reports/pages/MonthlyReportPage'

function AuthLoading() {
  return <main className="auth-screen"><div className="auth-main"><div className="auth-card" role="status" aria-live="polite">Restoring your session…</div></div></main>
}

export function AppRoutes() {
  const { page, authSession, authStatus } = useAppContext()

  if (authStatus === 'loading') return <AuthLoading />

  const authenticated = authStatus === 'authenticated' && authSession !== null
  if (!authenticated) {
    return page === 'register' ? <RegisterPage /> : <LoginPage />
  }

  if (page === 'login' || page === 'register') {
    return <AppLayout><DashboardPage /></AppLayout>
  }

  const route = {
    dashboard: <DashboardPage />,
    add: <AddReadingPage />,
    'daily-report': <DailyReportPage />,
    'monthly-report': <MonthlyReportPage />,
  }[page]

  return <AppLayout>{route}</AppLayout>
}
