import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { CalendarPlus, Cake, Users, Bell, Heart } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useEvents } from '@/features/events/hooks/useEvents'
import { useBirthdays } from '@/features/birthdays/hooks/useBirthdays'
import { useUsers } from '@/features/users/hooks/useUsers'
import { EventCard } from '@/components/cards/EventCard'
import { BirthdayCard } from '@/components/cards/BirthdayCard'
import { Loader } from '@/components/feedback/Loader'
import { EmptyState } from '@/components/feedback/EmptyState'
import { getInitials, nameToColor } from '@/utils/avatarUtils'

export function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const events = useEvents()
  const birthdays = useBirthdays(5)
  const users = useUsers()

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

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
