import { format } from 'date-fns'
import { BirthdayCard } from '@/features/birthdays/components/BirthdayCard/BirthdayCard'
import { useBirthdays, useGenerateBirthdays } from '@/features/birthdays/hooks/useBirthdays'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Loader } from '@/components/feedback/Loader/Loader'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { usePermissions } from '@/hooks/usePermissions'
import styles from './Birthdays.module.css'

export function Birthdays() {
  const { data = [], isLoading } = useBirthdays()
  const generate = useGenerateBirthdays()
  const permissions = usePermissions()
  const groups = data.reduce<Record<string, typeof data>>((acc, birthday) => {
    const month = format(new Date(birthday.birthdayThisYear), 'MMMM')
    acc[month] = [...(acc[month] || []), birthday]
    return acc
  }, {})

  if (isLoading) return <Loader />

  return (
    <div className={styles.page}>
      <h1>Birthdays</h1>
      {permissions.canCreateEvent || permissions.canManageUsers ? (
        <div>
          <Button loading={generate.isPending} onClick={() => generate.mutate(undefined, {
            onSuccess: () => toast.success('Birthday events generated'),
            onError: (err: unknown) => toast.error(err instanceof Error ? err.message : 'Failed to generate'),
          })}>
            Generate birthday events
          </Button>
        </div>
      ) : null}
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
