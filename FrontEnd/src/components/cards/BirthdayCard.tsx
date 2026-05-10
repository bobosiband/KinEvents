import { BellRing, Calendar, Cake, PartyPopper, Sparkles } from 'lucide-react'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/Button'
import type { BirthdayPreview } from '@/features/birthdays/api/birthdays.api'

const DAY_IN_MS = 86_400_000

function startOfDay(value: Date): Date {
  const next = new Date(value)
  next.setHours(0, 0, 0, 0)
  return next
}

function getUpcomingDate(value: string): Date {
  const today = startOfDay(new Date())
  const birthday = startOfDay(new Date(`${value}T00:00:00`))

  if (birthday < today) {
    birthday.setFullYear(birthday.getFullYear() + 1)
  }

  return birthday
}

function getDaysUntilBirthday(birthdayThisYear: string): number {
  const today = startOfDay(new Date())
  const birthday = getUpcomingDate(birthdayThisYear)
  return Math.ceil((birthday.getTime() - today.getTime()) / DAY_IN_MS)
}

function getAge(birthday?: string): number | null {
  if (!birthday || !/^\d{4}-\d{2}-\d{2}$/.test(birthday)) return null
  const birthYear = Number.parseInt(birthday.split('-')[0], 10)
  if (Number.isNaN(birthYear)) return null
  return new Date().getFullYear() - birthYear
}

interface BirthdayCardProps {
  birthday: BirthdayPreview
  onSendReminder?: () => void
  reminderLoading?: boolean
}

export function BirthdayCard({ birthday, onSendReminder, reminderLoading = false }: BirthdayCardProps) {
  const birthdayDate = getUpcomingDate(birthday.birthdayThisYear)
  const daysUntil = getDaysUntilBirthday(birthday.birthdayThisYear)
  const isToday = daysUntil === 0
  const age = getAge(birthday.user.birthday)

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={`relative overflow-hidden rounded-2xl shadow-md bg-card ${isToday ? 'ring-2 ring-amber-400/50' : ''}`}
    >
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: isToday ? 'linear-gradient(90deg, #f59e0b, #fb7185)' : 'linear-gradient(90deg, var(--warm-rose), var(--warm-peach))' }}
      />
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${isToday ? 'bg-amber-500/15' : 'bg-[var(--warm-rose)]/20'}`}>
              {isToday ? <PartyPopper className="w-5 h-5 text-amber-600" /> : <Cake className="w-5 h-5" style={{ color: 'var(--warm-rose)' }} />}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold truncate">{birthday.user.name}</h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                <span>{birthdayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
              {age !== null ? <p className="text-xs text-muted-foreground">Turns {age} on this birthday</p> : null}
            </div>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${isToday ? 'bg-amber-500/15 text-amber-700' : 'bg-muted'}`}>
            {isToday ? 'Today' : `${daysUntil} days`}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            {isToday ? 'Celebrate today' : 'Upcoming celebration'}
          </div>
          {onSendReminder ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={reminderLoading}
              onClick={onSendReminder}
              icon={<BellRing className="h-4 w-4" />}
            >
              Send Reminder
            </Button>
          ) : null}
        </div>
      </div>
    </motion.div>
  )
}
