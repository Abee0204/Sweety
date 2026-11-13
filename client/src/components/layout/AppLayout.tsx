import type { ReactNode } from 'react'
import { useAppContext } from '../../context/useAppContext'
import type { Page } from '../../types'
import { Icon } from '../common/Icon'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { Toast } from './Toast'

export function AppLayout({ children }: { children: ReactNode }) {
  const { page, setPage, readingsStatus, readingsError, retryReadings, authSession, authToken, logout } = useAppContext()
  const navigate = (next: Page) => setPage(next)
  const addReading = () => navigate('add')
  return <div className="app-shell"><Sidebar/><div className="main-column"><Header/><main className="content">
    {authToken && readingsStatus === 'loading' && <div className="panel" role="status">Loading your readings…</div>}
    {authToken && readingsStatus === 'error' && <div className="panel" role="alert">{readingsError ?? 'Could not load your readings.'} <button className="text-button" onClick={retryReadings}>Retry</button></div>}
    {children}
  </main><Toast/></div>
    <nav className="mobile-nav" aria-label="Mobile navigation"><button className={page === 'dashboard' ? 'mobile-nav-item selected' : 'mobile-nav-item'} onClick={() => navigate('dashboard')}><Icon name="grid" size={20}/>Home</button><button className={page === 'daily-report' || page === 'monthly-report' ? 'mobile-nav-item selected' : 'mobile-nav-item'} onClick={() => navigate('daily-report')}><Icon name="chart" size={20}/>Reports</button><button className="mobile-add" onClick={addReading} aria-label="Add reading"><Icon name="plus" size={22}/></button><button className="mobile-nav-item" onClick={() => authToken ? logout() : navigate('login')}><span className="mobile-avatar">{authSession?.user.name.charAt(0).toUpperCase() ?? 'S'}</span>{authToken ? 'Log out' : 'Account'}</button></nav>
  </div>
}
