import type { ReactNode } from 'react'

interface FieldProps {
  label: string
  id: string
  error?: string
  hint?: string
  children: ReactNode
}

export function Field({ label, error, id, children, hint }: FieldProps) {
  return <div className="field"><label htmlFor={id}>{label}</label>{children}{hint && !error && <span className="field-hint">{hint}</span>}{error && <span className="field-error" id={`${id}-error`} role="alert">{error}</span>}</div>
}
