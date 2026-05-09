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
    setError('')
    mutation.mutate({ email }, {
      onSuccess: data => {
        setAuth(data.user, data.token)
        navigate(data.user.role === 'admin' ? '/admin' : '/')
      },
      onError: (loginError: any) => {
        const message = loginError?.response?.data?.message || loginError?.message || 'Login failed'
        setError(message)
      },
    })
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Left Column - Form */}
        <section className={styles.formSection} aria-labelledby="login-title">
          <div className={styles.formContent}>
            <div className={styles.branding}>
              <h1 className={styles.brand}>KinEvents</h1>
              <p className={styles.tagline}>Family moments, together</p>
            </div>

            <form onSubmit={submit} className={styles.form}>
              <div className={styles.formHeader}>
                <h2 id="login-title">Welcome back</h2>
                <p className={styles.subtitle}>Sign in to your account to continue</p>
              </div>

              {error && <div className={styles.errorBanner}>{error}</div>}

              <Input
                label="Email Address"
                type="email"
                placeholder="you@family.com"
                value={email}
                onChange={event => setEmail(event.target.value)}
                fullWidth
                disabled={mutation.isPending}
              />

              <Button
                type="submit"
                loading={mutation.isPending}
                fullWidth
              >
                {mutation.isPending ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            <div className={styles.links}>
              <Link to="/request-access" className={styles.link}>Don't have an account? Request access</Link>
              <Link to="/" className={styles.linkSecondary}>Back to home</Link>
            </div>
          </div>
        </section>

        {/* Right Column - Value Prop */}
        <section className={styles.promoSection}>
          <div className={styles.promoContent}>
            <h2>Stay connected with your family</h2>
            <p>Plan events, celebrate birthdays, and share moments together.</p>

            <ul className={styles.features}>
              <li>
                <span className={styles.featureIcon}>📅</span>
                <div>
                  <strong>Plan Events</strong>
                  <p>Organize family gatherings and celebrations</p>
                </div>
              </li>
              <li>
                <span className={styles.featureIcon}>🎂</span>
                <div>
                  <strong>Birthday Tracking</strong>
                  <p>Never miss a birthday with automatic reminders</p>
                </div>
              </li>
              <li>
                <span className={styles.featureIcon}>📢</span>
                <div>
                  <strong>Family Updates</strong>
                  <p>Share announcements and stay in the loop</p>
                </div>
              </li>
              <li>
                <span className={styles.featureIcon}>👥</span>
                <div>
                  <strong>Family Directory</strong>
                  <p>Keep everyone's contact info organized</p>
                </div>
              </li>
            </ul>

            <div className={styles.stats}>
              <div className={styles.stat}>
                <strong>100%</strong>
                <span>Private</span>
              </div>
              <div className={styles.stat}>
                <strong>∞</strong>
                <span>Free Forever</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Login
