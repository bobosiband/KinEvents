import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useLogin } from '@/features/auth/hooks/useLogin'
import { useAuthStore } from '@/features/auth/store/authStore'
import styles from './Login.module.css'

export function Login() {
  const navigate = useNavigate()
  const setAuth = useAuthStore(state => state.setAuth)
  const mutation = useLogin()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!email.includes('@')) {
      setError('Enter a valid email address.')
      return
    }
    mutation.mutate({ email }, {
      onSuccess: data => {
        setAuth(data.user, data.token)
        navigate(data.user.role === 'admin' ? '/admin' : '/')
      },
      onError: loginError => setError(loginError.message),
    })
  }

  return (
    <section className={styles.card}>
      <div className={styles.logo}>KinEvents</div>
      <form onSubmit={submit}>
        <Input label="Email" type="email" value={email} onChange={event => setEmail(event.target.value)} error={error} fullWidth />
        <Button type="submit" loading={mutation.isPending} fullWidth>Sign In</Button>
      </form>
      <Link to="/request-access">Request Access</Link>
    </section>
  )
}
