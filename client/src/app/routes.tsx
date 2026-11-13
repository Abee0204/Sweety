import { AppLayout } from '../components/layout/AppLayout'
import { useAppContext } from '../context/useAppContext'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { RegisterPage } from '../features/auth/pages/RegisterPage'
import { DashboardPage } from '../features/dashboard/pages/DashboardPage'
import { AddReadingPage } from '../features/readings/pages/AddReadingPage'
import { DailyReportPage } from '../features/reports/pages/DailyReportPage'
import { MonthlyReportPage } from '../features/reports/pages/MonthlyReportPage'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'

function AuthLoading() {
  return <main className="auth-screen"><div className="auth-main"><div className="auth-card" role="status" aria-live="polite">Restoring your session…</div></div></main>
}

function PublicRoute() {
  const { authSession, authStatus } = useAppContext()

  if (authStatus === 'loading') return <AuthLoading />
  if (authStatus === 'authenticated' && authSession) return <Navigate to="/dashboard" replace />
  return <Outlet />
}

function ProtectedRoute() {
  const { authSession, authStatus } = useAppContext()

  if (authStatus === 'loading') return <AuthLoading />
  if (authStatus !== 'authenticated' || !authSession) return <Navigate to="/login" replace />
  return <AppLayout><Outlet /></AppLayout>
}

function HomeRoute() {
  const { authSession, authStatus } = useAppContext()
  if (authStatus === 'loading') return <AuthLoading />
  return <Navigate to={authStatus === 'authenticated' && authSession ? '/dashboard' : '/login'} replace />
}

export function AppRoutes() {
  return <Routes>
    <Route element={<PublicRoute />}>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
    </Route>
    <Route element={<ProtectedRoute />}>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/readings/add" element={<AddReadingPage />} />
      <Route path="/reports/daily" element={<DailyReportPage />} />
      <Route path="/reports/monthly" element={<MonthlyReportPage />} />
    </Route>
    <Route path="/" element={<HomeRoute />} />
    <Route path="*" element={<HomeRoute />} />
  </Routes>
}
