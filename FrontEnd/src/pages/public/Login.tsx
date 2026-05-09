import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Heart, Mail } from 'lucide-react'
import { motion } from 'motion/react'
import { useLogin } from '@/features/auth/hooks/useLogin'
import { useAuthStore } from '@/features/auth/store/authStore'

export function Login() {
  const navigate = useNavigate()
  const setAuth = useAuthStore(state => state.setAuth)
  const mutation = useLogin()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!email.includes('@')) { setError('Enter a valid email address.'); return }
    setError('')
    mutation.mutate({ email }, {
      onSuccess: (data) => {
        setAuth(data.user, data.token)
        navigate(data.user.role === 'admin' ? '/admin' : '/home', { replace: true })
      },
      onError: (err: any) => {
        setError(err?.response?.data?.message || err?.message || 'Login failed')
      },
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff5f5] via-[#fff9f0] to-[#f0f9ff] dark:from-[#1a1a1a] dark:via-[#1f1a1a] dark:to-[#1a1f24] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
        <div className="bg-card rounded-3xl shadow-xl p-8">
          <div className="text-center mb-8">
            <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }} className="inline-flex items-center gap-2 mb-4">
              <Heart className="w-10 h-10 text-primary fill-primary" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[var(--warm-coral)] to-[var(--warm-rose)] bg-clip-text text-transparent">KinEvents</h1>
            </motion.div>
            <h2 className="text-2xl font-semibold mb-2">Welcome Back</h2>
            <p className="text-muted-foreground">Sign in to see what your family is up to</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive font-medium">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="you@family.com"
                  required
                  disabled={mutation.isPending}
                />
              </div>
            </div>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={mutation.isPending}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow disabled:opacity-60"
            >
              {mutation.isPending ? 'Signing in...' : 'Sign In'}
            </motion.button>
          </form>

          <div className="mt-6 space-y-2 text-center">
            <Link to="/request-access" className="block text-sm text-primary hover:underline">
              Don't have access? Request to join
            </Link>
            <Link to="/" className="block text-sm text-muted-foreground hover:text-foreground">
              ← Back to home
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
