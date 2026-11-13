import type { ReactNode } from 'react'
import { useAppContext } from '../../context/useAppContext'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Icon } from '../common/Icon'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { Toast } from './Toast'

export function AppLayout({ children }: { children: ReactNode }) {
  const { readingsStatus, readingsError, retryReadings, authSession, authToken, logout } = useAppContext()
  const location = useLocation()
  const navigate = useNavigate()
  return <div className="app-shell"><Sidebar/><div className="main-column"><Header/><main className="content">
    {authToken && readingsStatus === 'loading' && <div className="panel" role="status">Loading your readings…</div>}
    {authToken && readingsStatus === 'error' && <div className="panel" role="alert">{readingsError ?? 'Could not load your readings.'} <button className="text-button" onClick={retryReadings}>Retry</button></div>}
    {children}
  </main><Toast/></div>
    <nav className="mobile-nav" aria-label="Mobile navigation"><NavLink to="/dashboard" className={({ isActive }) => isActive ? 'mobile-nav-item selected' : 'mobile-nav-item'}><Icon name="grid" size={20}/>Home</NavLink><Link to="/reports/daily" className={location.pathname.startsWith('/reports/') ? 'mobile-nav-item selected' : 'mobile-nav-item'}><Icon name="chart" size={20}/>Reports</Link><Link className="mobile-add" to="/readings/add" aria-label="Add reading"><Icon name="plus" size={22}/></Link><button className="mobile-nav-item" onClick={() => authToken ? logout() : navigate('/login')}><span className="mobile-avatar">{authSession?.user.name.charAt(0).toUpperCase() ?? 'S'}</span>{authToken ? 'Log out' : 'Account'}</button></nav>
  </div>
}
