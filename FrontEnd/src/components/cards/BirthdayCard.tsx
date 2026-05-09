import { Cake, Calendar } from 'lucide-react'
import { motion } from 'motion/react'
import type { Birthday } from '@/features/birthdays/api/birthdays.api'

interface BirthdayCardProps {
  birthday: Birthday
}

export function BirthdayCard({ birthday }: BirthdayCardProps) {
  const today = new Date()
  const birthdayDate = new Date(birthday.birthdayThisYear)
  const daysUntil = Math.max(0, Math.ceil((birthdayDate.getTime() - today.getTime()) / 86_400_000))
  const isToday = daysUntil === 0

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="relative overflow-hidden rounded-2xl shadow-md cursor-pointer bg-card"
    >
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: 'linear-gradient(90deg, var(--warm-rose), var(--warm-peach))' }}
      />
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[var(--warm-rose)]/20">
              <Cake className="w-5 h-5" style={{ color: 'var(--warm-rose)' }} />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold truncate">{birthday.user.name}</h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                <span>{birthdayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            </div>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-muted font-medium">
            {isToday ? 'Today' : `${daysUntil} days`}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
