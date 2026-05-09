import { Heart, User, Users as UsersIcon, Mail, MessageSquare, Send } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRequestAccess } from '@/features/auth/hooks/useRequestAccess'

export function RequestAccess() {
  const navigate = useNavigate()
  const mutation = useRequestAccess()
  const [name, setName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [email, setEmail] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.includes('@')) {
      setError('Name and valid email are required.')
      return
    }

    const composedMessage = relationship.trim()
      ? `Relationship: ${relationship}\n\n${reason}`
      : reason

    mutation.mutate(
      { name, email, message: composedMessage },
      {
        onSuccess: () => {
          navigate('/pending-approval', { state: { email } })
        },
        onError: (err: any) => {
          setError(err?.response?.data?.message || err?.message || 'Unable to submit request')
        },
      },
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff5f5] via-[#fff9f0] to-[#f0f9ff] dark:from-[#1a1a1a] dark:via-[#1f1a1a] dark:to-[#1a1f24] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg"
      >
        <div className="bg-card rounded-3xl shadow-xl p-8">
          <div className="text-center mb-8">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="inline-flex items-center gap-2 mb-4"
            >
              <Heart className="w-10 h-10 text-primary fill-primary" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[var(--warm-coral)] to-[var(--warm-rose)] bg-clip-text text-transparent">
                KinEvents
              </h1>
            </motion.div>
            <h2 className="text-2xl font-semibold mb-2">Request Family Access</h2>
            <p className="text-muted-foreground">
              Tell us how you're connected to the family. An admin will review your request.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            {error ? <div className="text-sm text-destructive bg-destructive/10 rounded-xl p-3">{error}</div> : null}
            <div>
              <label className="block text-sm font-medium mb-2">Your Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="John Smith"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Family Connection</label>
              <div className="relative">
                <UsersIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., Cousin, Uncle, Friend of the family"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Why would you like to join?</label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px] resize-none"
                  placeholder="Share a bit about your connection to the family..."
                  required
                />
              </div>
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={mutation.isPending}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Send className="w-5 h-5" />
              {mutation.isPending ? 'Submitting...' : 'Submit Request'}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to home
            </button>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-xl">
            <p className="text-xs text-muted-foreground text-center">
              Your request will be reviewed by a family admin. You'll receive an email once your access is approved.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
