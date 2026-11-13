import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ApiError, apiClient } from '../../../api/client'
import { Button } from '../../../components/common/Button'
import { Field } from '../../../components/common/Field'
import { Icon } from '../../../components/common/Icon'
import { useAppContext } from '../../../context/useAppContext'
import type { AuthSession, AuthUser } from '../../../types'
import { loginSchema, registrationSchema, type LoginValues, type RegistrationValues } from '../validation'

interface RegistrationResponse {
  success: boolean
  message: string
  data: AuthUser & { createdAt: string }
}

interface LoginResponse {
  success: boolean
  message: string
  data: AuthSession
}

type AuthField = 'name' | 'email' | 'password'
type ApiFieldErrors = Partial<Record<AuthField, string>>

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const getApiFieldErrors = (error: unknown): ApiFieldErrors => {
  if (!(error instanceof ApiError) || !isRecord(error.data) || !isRecord(error.data.errors)) {
    return {}
  }

  const errors = error.data.errors
  const fieldErrors: ApiFieldErrors = {}
  for (const field of ['name', 'email', 'password'] as const) {
    const messages = errors[field]
    const message = Array.isArray(messages)
      ? messages.find((candidate): candidate is string => typeof candidate === 'string')
      : undefined
    if (message) fieldErrors[field] = message
  }
  return fieldErrors
}

const getApiErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unable to complete the request. Please try again.'

export function AuthForm({ registering }: { registering: boolean }) {
  const { setPage, showToast, setAuthSession } = useAppContext()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const login = useForm<LoginValues>({ resolver: zodResolver(loginSchema), mode: 'onTouched' })
  const registration = useForm<RegistrationValues>({ resolver: zodResolver(registrationSchema), mode: 'onTouched' })
  const passwordValue = useWatch({ control: registration.control, name: 'password' }) ?? ''
  const passwordScore = [passwordValue.length >= 8, /[A-Z]/.test(passwordValue), /[0-9]/.test(passwordValue), /[^A-Za-z0-9]/.test(passwordValue)].filter(Boolean).length

  const loginSubmit = login.handleSubmit(async ({ email, password }) => {
    setFormError('')
    login.clearErrors()
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', { email, password })
      const session = response?.data
      if (!session?.token || !session.user?.id || !session.user.name || !session.user.email) {
        throw new Error('The server returned an incomplete login response.')
      }

      setAuthSession(session)
      setPage('dashboard')
      showToast(`Welcome back, ${session.user.name}.`)
    } catch (error) {
      const fieldErrors = getApiFieldErrors(error)
      if (fieldErrors.email) login.setError('email', { type: 'server', message: fieldErrors.email })
      if (fieldErrors.password) login.setError('password', { type: 'server', message: fieldErrors.password })
      if (!Object.values(fieldErrors).some(Boolean)) setFormError(getApiErrorMessage(error))
    }
  })

  const registerSubmit = registration.handleSubmit(async ({ name, email, password }) => {
    setFormError('')
    setSuccessMessage('')
    registration.clearErrors()
    try {
      const response = await apiClient.post<RegistrationResponse>('/auth/register', { name, email, password })
      if (!response?.data?.id) {
        throw new Error('The server returned an incomplete registration response.')
      }
      setSuccessMessage(response.message || 'Account created. You can sign in now.')
    } catch (error) {
      const fieldErrors = getApiFieldErrors(error)
      if (fieldErrors.name) registration.setError('name', { type: 'server', message: fieldErrors.name })
      if (fieldErrors.email) registration.setError('email', { type: 'server', message: fieldErrors.email })
      if (fieldErrors.password) registration.setError('password', { type: 'server', message: fieldErrors.password })
      if (!Object.values(fieldErrors).some(Boolean)) setFormError(getApiErrorMessage(error))
    }
  })

  return <div className="auth-card"><div className="auth-mobile-mark"><span className="brand-mark"><Icon name="drop" size={20}/></span></div><div className="eyebrow">{registering ? 'A FRESH START' : 'WELCOME BACK'}</div><h1>{registering ? 'Create your account' : 'Good to see you'}</h1><p className="auth-subtitle">{registering ? 'A few details and you’re all set.' : 'Sign in to continue your wellness journey.'}</p>
    {formError && <div className="field-error" role="alert">{formError}</div>}
    {successMessage && <p className="auth-subtitle" role="status">{successMessage}</p>}
    {registering ? <form noValidate onSubmit={registerSubmit}>
      <Field id="auth-name" label="Full name" error={registration.formState.errors.name?.message}><input id="auth-name" type="text" autoComplete="name" placeholder="Your name" aria-invalid={!!registration.formState.errors.name} aria-describedby={registration.formState.errors.name ? 'auth-name-error' : undefined} {...registration.register('name')}/></Field>
      <Field id="auth-email" label="Email address" error={registration.formState.errors.email?.message}><input id="auth-email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={!!registration.formState.errors.email} aria-describedby={registration.formState.errors.email ? 'auth-email-error' : undefined} {...registration.register('email')}/></Field>
      <Field id="auth-password" label="Password" error={registration.formState.errors.password?.message}><div className="password-wrap"><input id="auth-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="At least 8 characters" aria-invalid={!!registration.formState.errors.password} aria-describedby={registration.formState.errors.password ? 'auth-password-error' : undefined} {...registration.register('password')}/><button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}><Icon name={showPassword ? 'eyeOff' : 'eye'} size={18}/></button></div>{passwordValue && <div className="strength"><div className="strength-bars">{[1,2,3,4].map((level) => <i key={level} className={passwordScore >= level ? `strength-${passwordScore}` : ''}/>)}</div><span>{['Add a password', 'Needs work', 'Fair', 'Good', 'Strong'][passwordScore]}</span></div>}</Field>
      <Field id="auth-confirm" label="Confirm password" error={registration.formState.errors.confirmPassword?.message}><div className="password-wrap"><input id="auth-confirm" type={showConfirm ? 'text' : 'password'} autoComplete="new-password" placeholder="Enter your password again" aria-invalid={!!registration.formState.errors.confirmPassword} aria-describedby={registration.formState.errors.confirmPassword ? 'auth-confirm-error' : undefined} {...registration.register('confirmPassword')}/><button type="button" className="password-toggle" onClick={() => setShowConfirm(!showConfirm)} aria-label={showConfirm ? 'Hide password' : 'Show password'}><Icon name={showConfirm ? 'eyeOff' : 'eye'} size={18}/></button></div></Field>
      <Button className="auth-submit" type="submit" disabled={!registration.formState.isValid || registration.formState.isSubmitting}>{registration.formState.isSubmitting ? <><span className="spinner"/>Creating account…</> : <>Create account <Icon name="chevron" size={17}/></>}</Button>
    </form> : <form noValidate onSubmit={loginSubmit}>
      <Field id="auth-email" label="Email address" error={login.formState.errors.email?.message}><input id="auth-email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={!!login.formState.errors.email} aria-describedby={login.formState.errors.email ? 'auth-email-error' : undefined} {...login.register('email')}/></Field>
      <Field id="auth-password" label="Password" error={login.formState.errors.password?.message}><div className="password-wrap"><input id="auth-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" aria-invalid={!!login.formState.errors.password} aria-describedby={login.formState.errors.password ? 'auth-password-error' : undefined} {...login.register('password')}/><button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}><Icon name={showPassword ? 'eyeOff' : 'eye'} size={18}/></button></div></Field>
      <Button className="auth-submit" type="submit" disabled={!login.formState.isValid || login.formState.isSubmitting}>{login.formState.isSubmitting ? <><span className="spinner"/>Signing in…</> : <>Sign in <Icon name="chevron" size={17}/></>}</Button>
    </form>}
    <div className="auth-switch">{registering ? 'Already have an account?' : 'New to Sweety?'} <button type="button" onClick={() => setPage(registering ? 'login' : 'register')}>{registering ? 'Sign in' : 'Create account'}</button></div><div className="demo-note"><span className="privacy-dot"/>Your account details are sent to Sweety.</div></div>
}
