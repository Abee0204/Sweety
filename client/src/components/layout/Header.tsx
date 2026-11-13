import { useAppContext } from '../../context/useAppContext'
import type { Page } from '../../types'
import { Icon } from '../common/Icon'

export function Header() {
  const { setPage } = useAppContext()
  const navigate = (page: Page) => setPage(page)
  return <header className="topbar"><button className="mobile-brand" onClick={() => navigate('dashboard')}><span className="brand-mark"><Icon name="drop" size={20}/></span>Sweety</button><div className="topbar-spacer"/><span className="today-pill"><span className="status-dot"/>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span><button className="avatar top-avatar" onClick={() => navigate('login')} aria-label="Open account">S</button></header>
}
