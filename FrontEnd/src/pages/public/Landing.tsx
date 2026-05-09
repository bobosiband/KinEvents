import { Heart, Calendar, Cake, Users, ArrowRight, Shield } from 'lucide-react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useEffect } from 'react'

export function Landing() {
  const navigate = useNavigate()
  const user = useAuthStore(state => state.user)
  const token = useAuthStore(state => state.token)

  useEffect(() => {
    if (user && token) {
      navigate(user.role === 'admin' ? '/admin' : '/home', { replace: true })
    }
  }, [user, token, navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff5f5] via-[#fff9f0] to-[#f0f9ff] dark:from-[#1a1a1a] dark:via-[#1f1a1a] dark:to-[#1a1f24]">
      <div className="container mx-auto px-4 pt-12 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="inline-flex items-center gap-2 mb-6"
          >
            <Heart className="w-12 h-12 text-primary fill-primary" />
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-[var(--warm-coral)] to-[var(--warm-rose)] bg-clip-text text-transparent">
              KinEvents
            </h1>
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">Your Family's Digital Home</h2>
          <p className="text-lg text-muted-foreground mb-8">
            A private, secure space to celebrate birthdays, plan events, and stay connected with the people who matter most.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/request-access')}
              className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center gap-2"
            >
              Request Access <ArrowRight className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-card text-foreground rounded-2xl font-semibold shadow-md hover:shadow-lg transition-shadow"
            >
              Family Login
            </motion.button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
          {[
            { icon: Cake, title: 'Never Miss a Birthday', description: 'Automatic reminders and countdown timers for every family member', color: 'var(--warm-rose)' },
            { icon: Calendar, title: 'Plan Together', description: 'Coordinate family events, gatherings, and celebrations effortlessly', color: 'var(--warm-mint)' },
            { icon: Users, title: 'Stay Connected', description: 'Share moments and memories in your private family space', color: 'var(--warm-sky)' },
          ].map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="bg-card rounded-3xl p-6 shadow-md hover:shadow-xl transition-all"
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: `${feature.color}30` }}>
                  <Icon className="w-8 h-8" style={{ color: feature.color }} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            )
          })}
        </div>

        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Shield className="w-5 h-5" />
          <span className="text-sm">Private & Secure - Only for Your Family</span>
        </div>
      </div>
    </div>
  )
}
