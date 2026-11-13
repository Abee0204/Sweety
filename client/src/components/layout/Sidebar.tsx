import { useAppContext } from '../../context/useAppContext'
import type { Page } from '../../types'
import { Icon } from '../common/Icon'

export function Sidebar() {
  const { page, setPage } = useAppContext()
  const navigate = (next: Page) => setPage(next)

  return <aside className="sidebar"><button className="brand" onClick={() => navigate('dashboard')} aria-label="Sweety home"><span className="brand-mark"><Icon name="drop" size={22}/></span><span>Sweety<small>GLUCOSE TRACKER</small></span></button>
    <div className="nav-caption">MENU</div><nav className="side-nav" aria-label="Main navigation">
      <button className={page === 'dashboard' ? 'nav-item active' : 'nav-item'} onClick={() => navigate('dashboard')}><Icon name="grid"/>Dashboard</button>
      <button className={page === 'daily-report' || page === 'monthly-report' ? 'nav-item active' : 'nav-item'} onClick={() => navigate('daily-report')}><Icon name="chart"/>Reports</button>
      <button className="nav-item" onClick={() => navigate('add')}><Icon name="plus"/>Add reading</button>
    </nav>
    <div className="sidebar-spacer"/><div className="goal-card"><div className="goal-icon"><Icon name="check" size={17}/></div><strong>One day at a time</strong><p>Small steps make a big difference.</p></div>
    <button className="profile-button" onClick={() => navigate('login')}><span className="avatar">S</span><span className="profile-label"><strong>My account</strong><small>Local demo</small></span><Icon name="logout" size={17}/></button>
  </aside>
}
