import { useAppContext } from '../../context/useAppContext'
import { Icon } from '../common/Icon'

export function Toast() {
  const { toast, clearToast } = useAppContext()
  if (!toast) return null
  return <div className="toast" role="status"><span className="toast-check"><Icon name="check" size={16}/></span>{toast}<button onClick={clearToast} aria-label="Dismiss message">×</button></div>
}
