import type { ReactNode } from 'react'
import { useAppContext } from '../../../context/useAppContext'
import { Icon } from '../../../components/common/Icon'

export function AuthLayout({ children }: { children: ReactNode }) {
  const { setPage } = useAppContext()
  return <main className="auth-screen"><div className="auth-side"><button className="brand auth-brand" onClick={() => setPage('dashboard')}><span className="brand-mark"><Icon name="drop" size={22}/></span><span>Sweety<small>GLUCOSE TRACKER</small></span></button><div className="auth-quote"><div className="quote-mark">“</div><h2>A little care,<br/>every day.</h2><p>A calmer way to keep an eye on your health and build habits that feel good.</p><div className="auth-dots"><i/><i/><i/></div></div><div className="auth-side-foot">A simple space for your wellbeing.</div></div><div className="auth-main"><button className="auth-back" onClick={() => setPage('dashboard')}>← <span>Back to dashboard</span></button>{children}</div></main>
}
