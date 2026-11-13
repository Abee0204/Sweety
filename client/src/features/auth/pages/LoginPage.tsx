import { AuthForm } from '../components/AuthForm'
import { AuthLayout } from '../components/AuthLayout'

export function LoginPage() {
  return <AuthLayout><AuthForm registering={false}/></AuthLayout>
}
