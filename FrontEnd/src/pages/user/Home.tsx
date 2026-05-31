import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { CalendarPlus, Cake, Users, Bell, Heart, Phone } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { useEvents } from '@/features/events/hooks/useEvents'
import { useBirthdays } from '@/features/birthdays/hooks/useBirthdays'
import { useUsers } from '@/features/users/hooks/useUsers'
import { useProfile } from '@/features/users/hooks/useProfile'
import { useAuthStore } from '@/features/auth/store/authStore'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EventCard } from '@/components/cards/EventCard'
import { BirthdayCard } from '@/components/cards/BirthdayCard'
import { Loader } from '@/components/feedback/Loader'
import { EmptyState } from '@/components/feedback/EmptyState'
import { getInitials, nameToColor } from '@/utils/avatarUtils'
import { useState } from 'react'

export function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const token = useAuthStore(state => state.token)
  const setAuth = useAuthStore(state => state.setAuth)
  const events = useEvents()
  const birthdays = useBirthdays(5)
  const users = useUsers()
  const profile = useProfile(user?.id || '')
  const [phoneDismissed, setPhoneDismissed] = useState(false)
  const [phoneDraft, setPhoneDraft] = useState('')
  const [phoneError, setPhoneError] = useState('')

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const shouldPromptPhone = Boolean(user && !user.phone && !phoneDismissed)

  const submitPhone = () => {
    if (!user) return

    if (!/^\+[1-9]\d{7,14}$/.test(phoneDraft)) {
      setPhoneError('Use international format e.g. +447700900123')
      return
    }

    setPhoneError('')
    profile.mutate(
      { phone: phoneDraft, notificationPrefs: user.notificationPrefs },
      {
        onSuccess: response => {
          if (token) setAuth(response.user, token)
          toast.success('Phone number saved')
          setPhoneDismissed(true)
        },
        onError: err => toast.error(err.message || 'Failed to save phone'),
      },
    )
  }

  const quickActions = [
    { icon: CalendarPlus, label: 'New Event', color: 'var(--warm-mint)', onClick: () => navigate('/events/create') },
    { icon: Cake, label: 'Birthdays', color: 'var(--warm-rose)', onClick: () => navigate('/birthdays') },
    { icon: Users, label: 'Family', color: 'var(--warm-sky)', onClick: () => navigate('/family') },
    { icon: Bell, label: 'Updates', color: 'var(--warm-lavender)', onClick: () => navigate('/notifications') },
  ]

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <p className="text-xl font-medium text-muted-foreground">{greeting},</p>
          <motion.div animate={{ rotate: [0, 10, 0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}>
            <Heart className="w-5 h-5 text-primary fill-primary" />
          </motion.div>
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[var(--warm-coral)] to-[var(--warm-rose)] bg-clip-text text-transparent">
          {user?.name?.split(' ')[0] ?? 'Family'}
        </h1>
      </motion.div>

      {shouldPromptPhone && (
        <Card className="space-y-4 border-blue-500/20 bg-blue-500/5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-blue-500/15 p-2 text-blue-600">
                <Phone className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <h2 className="font-semibold text-sm">Add your phone number</h2>
                <p className="text-xs text-muted-foreground">
                  Used for gift reminders and important family notifications.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPhoneDismissed(true)}
              className="text-muted-foreground hover:text-foreground text-lg leading-none"
              aria-label="Dismiss phone prompt"
            >
              ×
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="space-y-1.5">
              <span className="text-sm font-medium">Phone number</span>
              <input
                type="tel"
                value={phoneDraft}
                onChange={e => setPhoneDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') submitPhone() }}
                placeholder="+447700900123"
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <div className="flex items-end">
              <Button
                type="button"
                size="sm"
                loading={profile.isPending}
                onClick={submitPhone}
                icon={<Phone className="h-4 w-4" />}
              >
                Save
              </Button>
            </div>
          </div>
          {phoneError ? (
            <p className="text-xs text-destructive">{phoneError}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Include country code e.g. +44 for UK, +1 for US
            </p>
          )}
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quickActions.map((action, index) => {
          const Icon = action.icon
          return (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.07 }}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={action.onClick}
              className="bg-card rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-2"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${action.color}30` }}>
                <Icon className="w-6 h-6" style={{ color: action.color }} />
              </div>
              <span className="text-sm font-medium">{action.label}</span>
            </motion.button>
          )
        })}
      </div>

      {users.data && users.data.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="bg-card rounded-2xl p-4 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground mb-3">Family Members</p>
          <div className="flex items-center -space-x-2">
            {users.data.slice(0, 8).map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.2, zIndex: 10 }}
                className="w-10 h-10 rounded-full border-2 border-background flex items-center justify-center text-sm font-semibold text-white shadow-md cursor-pointer flex-shrink-0"
                style={{ backgroundColor: nameToColor(member.name) }}
                title={member.name}
              >
                {getInitials(member.name)}
              </motion.div>
            ))}
            {users.data.length > 8 && (
              <div className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-semibold flex-shrink-0">
                +{users.data.length - 8}
              </div>
            )}
          </div>
        </motion.div>
      )}

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Upcoming Events</h2>
          <button onClick={() => navigate('/events')} className="text-sm text-primary font-medium hover:underline">See all</button>
        </div>
        {events.isLoading && <Loader />}
        {!events.isLoading && (!events.data || events.data.length === 0) && (
          <EmptyState title="No upcoming events" message="Create the first family plan." />
        )}
        <div className="space-y-3">
          {events.data?.slice(0, 3).map(event => (
            <EventCard
              key={event.id}
              event={event}
              currentUserId={user?.id}
              onClick={() => navigate(`/events/${event.id}`)}
            />
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Upcoming Birthdays</h2>
          <button onClick={() => navigate('/birthdays')} className="text-sm text-primary font-medium hover:underline">See all</button>
        </div>
        {birthdays.isLoading && <Loader />}
        {!birthdays.isLoading && (!birthdays.data || birthdays.data.length === 0) && (
          <EmptyState title="No birthdays soon" message="Add birthdays in profiles." />
        )}
        <div className="space-y-3">
          {birthdays.data?.slice(0, 3).map(birthday => (
            <BirthdayCard key={birthday.user.id} birthday={birthday} />
          ))}
        </div>
      </section>
    </div>
  )
}
