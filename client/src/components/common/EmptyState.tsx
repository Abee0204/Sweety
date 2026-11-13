import type { ReactNode } from 'react'

interface EmptyStateProps {
  className?: string
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ className = '', icon, title, description, action }: EmptyStateProps) {
  return <div className={className}><span className="empty-icon">{icon}</span><strong>{title}</strong><p>{description}</p>{action}</div>
}
