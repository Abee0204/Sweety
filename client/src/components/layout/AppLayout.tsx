import type { ReactNode } from 'react'
import { useAppContext } from '../../context/useAppContext'
import type { Page } from '../../types'
import { today } from '../../utils/dates'
import { Icon } from '../common/Icon'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { Toast } from './Toast'

export function AppLayout({ children }: { children: ReactNode }) {
  const { page, setPage, readings, showToast, authSession, authToken, logout } = useAppContext()
  const navigate = (next: Page) => setPage(next)
  const addReading = () => {
    if (readings.filter((reading) => reading.date === today()).length >= 4) {
      showToast('Daily limit reached — you can record up to 4 readings per day.')
      return
    }
    navigate('add')
  }
  return <div className="app-shell"><Sidebar/><div className="main-column"><Header/><main className="content">{children}</main><Toast/></div>
    <nav className="mobile-nav" aria-label="Mobile navigation"><button className={page === 'dashboard' ? 'mobile-nav-item selected' : 'mobile-nav-item'} onClick={() => navigate('dashboard')}><Icon name="grid" size={20}/>Home</button><button className={page === 'daily-report' || page === 'monthly-report' ? 'mobile-nav-item selected' : 'mobile-nav-item'} onClick={() => navigate('daily-report')}><Icon name="chart" size={20}/>Reports</button><button className="mobile-add" onClick={addReading} aria-label="Add reading"><Icon name="plus" size={22}/></button><button className="mobile-nav-item" onClick={() => authToken ? logout() : navigate('login')}><span className="mobile-avatar">{authSession?.user.name.charAt(0).toUpperCase() ?? 'S'}</span>{authToken ? 'Log out' : 'Account'}</button></nav>
  </div>
}
