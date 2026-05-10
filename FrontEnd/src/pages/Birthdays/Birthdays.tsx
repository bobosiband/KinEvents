import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { AlertCircle, Cake, CalendarDays, ChevronDown, Gift, PartyPopper, ShieldCheck } from 'lucide-react'
import { BirthdayCard } from '@/features/birthdays/components/BirthdayCard/BirthdayCard'
import { useBirthdays, useGenerateBirthdays, useSendBirthdayReminders } from '@/features/birthdays/hooks/useBirthdays'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Loader } from '@/components/feedback/Loader/Loader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { usePermissions } from '@/hooks/usePermissions'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useProfile } from '@/features/users/hooks/useProfile'
import { useUsers } from '@/features/users/hooks/useUsers'
import { isValidBirthday } from '@/features/birthdays/api/birthdays.api'

const MS_IN_DAY = 86_400_000

function groupBirthdaysByMonth<T extends { birthdayThisYear: string }>(birthdays: T[]) {
  return birthdays.reduce<Record<string, T[]>>((acc, birthday) => {
    const month = new Date(`${birthday.birthdayThisYear}T00:00:00`).toLocaleString('default', { month: 'long' })
    if (!acc[month]) acc[month] = []
    acc[month].push(birthday)
    return acc
  }, {})
}

function getDaysUntilBirthday(birthdayThisYear: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const birthday = new Date(`${birthdayThisYear}T00:00:00`)
  birthday.setHours(0, 0, 0, 0)

  if (birthday < today) {
    birthday.setFullYear(birthday.getFullYear() + 1)
  }

  return Math.ceil((birthday.getTime() - today.getTime()) / MS_IN_DAY)
}

export function Birthdays() {
  const navigate = useNavigate()
  const { user, token } = useAuth()
  const setAuth = useAuthStore(state => state.setAuth)
  const queryClient = useQueryClient()

  const { data = [], isLoading, isError, error, refetch } = useBirthdays(20)
  const { data: users = [], isLoading: isUsersLoading } = useUsers()
  const generate = useGenerateBirthdays()
  const reminders = useSendBirthdayReminders()
  const profile = useProfile(user?.id || '')
  const permissions = usePermissions()
  const [birthdayDraft, setBirthdayDraft] = useState(user?.birthday || '')
  const [birthdayError, setBirthdayError] = useState('')

  useEffect(() => {
    setBirthdayDraft(user?.birthday || '')
  }, [user?.birthday])

  if (isLoading) return <Loader />

  if (isError) {
    return (
      <Card className="space-y-4 border border-destructive/20 bg-destructive/5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-destructive/10 p-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-semibold">Couldn&apos;t load birthdays</h1>
            <p className="text-sm text-muted-foreground">{error instanceof Error ? error.message : 'Try again in a moment.'}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button type="button" onClick={() => refetch()}>
            Retry
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/profile')}>
            Add my birthday
          </Button>
        </div>
      </Card>
    )
  }

  const todayISO = new Date().toISOString().split('T')[0]
  const todayBirthdays = data.filter(birthday => birthday.birthdayThisYear === todayISO)
  const upcomingOnly = data.filter(birthday => birthday.birthdayThisYear !== todayISO)
  const groups = groupBirthdaysByMonth(upcomingOnly)
  const groupsEntries = Object.entries(groups)
  const validUsers = users.filter(member => isValidBirthday(member.birthday))
  const missingBirthdayCount = users.filter(member => !isValidBirthday(member.birthday)).length
  const shouldPromptBirthday = !isValidBirthday(user?.birthday)

  const submitBirthday = () => {
    if (!user) return

    if (!birthdayDraft || !/^\d{4}-\d{2}-\d{2}$/.test(birthdayDraft)) {
      setBirthdayError('Use YYYY-MM-DD format.')
      return
    }

    setBirthdayError('')
    profile.mutate(
      { birthday: birthdayDraft, notificationPrefs: user.notificationPrefs },
      {
        onSuccess: (response) => {
          const nextToken = response.token ?? token
          if (nextToken) {
            setAuth(response.user, nextToken)
          }
          queryClient.invalidateQueries({ queryKey: ['birthdays'] })
          queryClient.invalidateQueries({ queryKey: ['users'] })
          toast.success('Birthday saved')
        },
        onError: (err) => {
          toast.error(err.message || 'Failed to save birthday')
        },
      },
    )
  }

  const handleReminder = () => {
    reminders.mutate(7, {
      onSuccess: () => toast.success('Birthday reminders sent'),
      onError: (err) => toast.error(err.message || 'Failed to send reminders'),
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700">
          <Gift className="h-3.5 w-3.5" />
          Family celebrations
        </div>
        <h1 className="text-2xl font-bold">Birthdays</h1>
        <p className="text-sm text-muted-foreground">Track upcoming celebrations, spotlight today&apos;s birthdays, and help members add missing dates.</p>
      </div>

      {shouldPromptBirthday ? (
        <Card className="space-y-4 border-amber-500/20 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-amber-500/15 p-2 text-amber-700">
              <Cake className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <h2 className="font-semibold">Your birthday isn&apos;t set yet</h2>
              <p className="text-sm text-muted-foreground">Add it so family members can celebrate with you.</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="space-y-2">
              <span className="text-sm font-medium">Birthday</span>
              <input
                type="date"
                value={birthdayDraft}
                onChange={(event) => setBirthdayDraft(event.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm"
                aria-label="Birthday"
                placeholder="YYYY-MM-DD"
              />
            </label>
            <div className="flex items-end gap-3">
              <Button
                type="button"
                loading={profile.isPending}
                onClick={submitBirthday}
                icon={<CalendarDays className="h-4 w-4" />}
              >
                Set my birthday
              </Button>
            </div>
          </div>
          {birthdayError ? <p className="text-sm text-destructive">{birthdayError}</p> : <p className="text-xs text-muted-foreground">Use YYYY-MM-DD format only.</p>}
        </Card>
      ) : null}

      {permissions.canCreateEvent || permissions.canManageUsers ? (
        <div>
          <Button
            loading={generate.isPending}
            onClick={() => generate.mutate(undefined, {
              onSuccess: () => toast.success('Birthday events generated'),
              onError: (err: unknown) => toast.error(err instanceof Error ? err.message : 'Failed to generate'),
            })}
          >
            Generate birthday events
          </Button>
        </div>
      ) : null}

      <section className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <PartyPopper className="h-4 w-4 text-amber-600" />
          <h2 className="text-lg font-semibold">Today</h2>
        </div>
        {todayBirthdays.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {todayBirthdays.map(birthday => (
              <BirthdayCard
                key={birthday.user.id}
                birthday={birthday}
                onSendReminder={permissions.canManageUsers ? handleReminder : undefined}
                reminderLoading={reminders.isPending}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No birthdays today.</p>
        )}
      </section>

      {data.length === 0 ? (
        <EmptyState
          title="No upcoming birthdays"
          message={validUsers.length === 0 ? 'No family members have set a birthday yet. Prompt them to add one from their profile.' : 'Check back soon for upcoming celebrations.'}
        />
      ) : null}

      {groupsEntries.map(([month, birthdays]) => (
        <details key={month} open className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-lg font-semibold">
            <span>{month}</span>
            <span className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
              <ChevronDown className="h-4 w-4" />
              {birthdays.length} birthdays
            </span>
          </summary>
          <div className="grid gap-4 pt-4 md:grid-cols-2">
            {birthdays.map(birthday => (
              <BirthdayCard
                key={birthday.user.id}
                birthday={birthday}
                onSendReminder={permissions.canManageUsers ? handleReminder : undefined}
                reminderLoading={reminders.isPending}
              />
            ))}
          </div>
        </details>
      ))}

      {permissions.canManageUsers ? (
        <Card className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Admin birthday coverage</h2>
            <p className="text-sm text-muted-foreground">{isUsersLoading ? 'Checking profile completeness...' : `${missingBirthdayCount} members haven’t set a birthday yet`}</p>
          </div>
          <Button type="button" variant="secondary" onClick={() => navigate('/admin/users')} icon={<ShieldCheck className="h-4 w-4" />}>
            Review users
          </Button>
        </Card>
      ) : null}
    </div>
  )
}
