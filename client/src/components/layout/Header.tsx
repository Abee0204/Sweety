import { Link } from 'react-router-dom'
import { Icon } from '../common/Icon'

export function Header() {
  return <header className="topbar"><Link className="mobile-brand" to="/dashboard"><span className="brand-mark"><Icon name="drop" size={20}/></span>Sweety</Link><div className="topbar-spacer"/><span className="today-pill"><span className="status-dot"/>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span><Link className="avatar top-avatar" to="/dashboard" aria-label="Open account">S</Link></header>
}
