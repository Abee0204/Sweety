import { useAppContext } from '../../context/useAppContext'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Icon } from '../common/Icon'

export function Sidebar() {
  const { authSession, authToken, logout } = useAppContext()
  const location = useLocation()
  const navigate = useNavigate()
  const onReportsPage = location.pathname.startsWith('/reports/')

  return <aside className="sidebar"><Link className="brand" to="/dashboard" aria-label="Sweety home"><span className="brand-mark"><Icon name="drop" size={22}/></span><span>Sweety<small>GLUCOSE TRACKER</small></span></Link>
    <div className="nav-caption">MENU</div><nav className="side-nav" aria-label="Main navigation">
      <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}><Icon name="grid"/>Dashboard</NavLink>
      <Link to="/reports/daily" className={onReportsPage ? 'nav-item active' : 'nav-item'}><Icon name="chart"/>Reports</Link>
      <NavLink to="/readings/add" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}><Icon name="plus"/>Add reading</NavLink>
    </nav>
    <div className="sidebar-spacer"/><div className="goal-card"><div className="goal-icon"><Icon name="check" size={17}/></div><strong>One day at a time</strong><p>Small steps make a big difference.</p></div>
    <button className="profile-button" onClick={() => authToken ? logout() : navigate('/login')}><span className="avatar">{authSession?.user.name.charAt(0).toUpperCase() ?? 'S'}</span><span className="profile-label"><strong>{authSession?.user.name ?? 'My account'}</strong><small>{authSession?.user.email ?? 'Local demo'}</small></span><Icon name="logout" size={17}/></button>
  </aside>
}
