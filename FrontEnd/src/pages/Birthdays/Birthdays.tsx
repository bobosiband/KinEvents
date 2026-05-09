import { format } from 'date-fns'
import { BirthdayCard } from '@/features/birthdays/components/BirthdayCard/BirthdayCard'
import { useBirthdays, useGenerateBirthdays } from '@/features/birthdays/hooks/useBirthdays'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Loader } from '@/components/feedback/Loader/Loader'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { usePermissions } from '@/hooks/usePermissions'

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
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Birthdays</h1>
        <p className="text-sm text-muted-foreground">Track upcoming celebrations by month.</p>
      </div>
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
        <section key={month} className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h2 className="text-lg font-semibold">{month}</h2>
          {birthdays.map(birthday => <BirthdayCard key={birthday.user.id} birthday={birthday} />)}
        </section>
      ))}
    </div>
  )
}
