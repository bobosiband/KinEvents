import { format } from 'date-fns'
import { Avatar } from '@/components/ui/Avatar'
import type { Birthday } from '../../api/birthdays.api'
import styles from './BirthdayCard.module.css'

interface BirthdayCardProps {
  birthday: Birthday
}

export function BirthdayCard({ birthday }: BirthdayCardProps) {
  const today = new Date()
  const birthdayDate = new Date(birthday.birthdayThisYear)
  const daysUntil = Math.max(0, Math.ceil((birthdayDate.getTime() - today.getTime()) / 86_400_000))
  const label = daysUntil === 0 ? 'Today' : `${daysUntil} days`
  return (
    <article className={`${styles.card} ${daysUntil === 0 ? styles.today : ''}`}>
      <span className={styles.icon}>*</span>
      <Avatar name={birthday.user.name} size="sm" />
      <div>
        <h3>{birthday.user.name}</h3>
        <p>{format(birthdayDate, 'MMMM d')}</p>
      </div>
      <strong>{label}</strong>
    </article>
  )
}
