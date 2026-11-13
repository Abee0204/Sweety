import { AppLayout } from '../components/layout/AppLayout'
import { useAppContext } from '../context/useAppContext'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { RegisterPage } from '../features/auth/pages/RegisterPage'
import { DashboardPage } from '../features/dashboard/pages/DashboardPage'
import { AddReadingPage } from '../features/readings/pages/AddReadingPage'
import { DailyReportPage } from '../features/reports/pages/DailyReportPage'
import { MonthlyReportPage } from '../features/reports/pages/MonthlyReportPage'

export function AppRoutes() {
  const { page } = useAppContext()
  if (page === 'login') return <LoginPage/>
  if (page === 'register') return <RegisterPage/>

  const route = {
    dashboard: <DashboardPage/>,
    add: <AddReadingPage/>,
    'daily-report': <DailyReportPage/>,
    'monthly-report': <MonthlyReportPage/>,
  }[page]

  return <AppLayout>{route}</AppLayout>
}
