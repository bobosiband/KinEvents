import { format } from 'date-fns'
import { BirthdayCard } from '@/features/birthdays/components/BirthdayCard/BirthdayCard'
import { useBirthdays } from '@/features/birthdays/hooks/useBirthdays'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Loader } from '@/components/feedback/Loader/Loader'
import styles from './Birthdays.module.css'

export function Birthdays() {
  const { data = [], isLoading } = useBirthdays()
  const groups = data.reduce<Record<string, typeof data>>((acc, birthday) => {
    const month = format(new Date(birthday.birthdayThisYear), 'MMMM')
    acc[month] = [...(acc[month] || []), birthday]
    return acc
  }, {})

  if (isLoading) return <Loader />

  return (
    <div className={styles.page}>
      <h1>Birthdays</h1>
      {data.length === 0 ? <EmptyState title="No birthdays" message="Birthdays will show up here when profiles are updated." /> : null}
      {Object.entries(groups).map(([month, birthdays]) => (
        <section key={month} className={styles.group}>
          <h2>{month}</h2>
          {birthdays.map(birthday => <BirthdayCard key={birthday.user.id} birthday={birthday} />)}
        </section>
      ))}
    </div>
  )
}
