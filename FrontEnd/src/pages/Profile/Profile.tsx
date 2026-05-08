import { useEffect, useState, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useProfile } from '@/features/users/hooks/useProfile'
import type { NotificationChannel, NotificationLevel } from '@/features/auth/types/auth.types'
import styles from './Profile.module.css'

export function Profile() {
  const { user } = useAuth()
  const setAuth = useAuthStore(state => state.setAuth)
  const token = useAuthStore(state => state.token)
  const mutation = useProfile(user?.id || '')
  const [name, setName] = useState(user?.name || '')
  const [birthday, setBirthday] = useState(user?.birthday || '')
  const [level, setLevel] = useState<NotificationLevel>(user?.notificationPrefs.level || 'important')
  const [channels, setChannels] = useState<NotificationChannel[]>(user?.notificationPrefs.channels || ['email'])
  const [error, setError] = useState('')

  useEffect(() => {
    setName(user?.name || '')
    setBirthday(user?.birthday || '')
    setLevel(user?.notificationPrefs.level || 'important')
    setChannels(user?.notificationPrefs.channels || ['email'])
  }, [user])

  if (!user) return null

  const toggleChannel = (channel: NotificationChannel) => {
    setChannels(current => current.includes(channel) ? current.filter(item => item !== channel) : [...current, channel])
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) {
      setError('Name is required.')
      return
    }
    if (birthday && !/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
      setError('Use YYYY-MM-DD format.')
      return
    }
    mutation.mutate({ name, birthday, notificationPrefs: { level, channels } }, {
      onSuccess: updated => {
        if (token) setAuth(updated, token)
        toast.success('Profile saved')
      },
    })
  }

  return (
    <form className={styles.page} onSubmit={submit}>
      <Card className={styles.header}>
        <Avatar name={user.name} size="xl" />
        <h1>{user.name}</h1>
        <p>{user.email}</p>
        <Badge tone="primary">{user.role}</Badge>
      </Card>
      <Input label="Name" value={name} onChange={event => setName(event.target.value)} error={error} fullWidth />
      <Input label="Birthday" value={birthday} onChange={event => setBirthday(event.target.value)} error={error} hint="YYYY-MM-DD" fullWidth />
      <label className={styles.label}>
        <span>Notification level</span>
        <select value={level} onChange={event => setLevel(event.target.value as NotificationLevel)}>
          <option value="all">All</option>
          <option value="important">Important</option>
          <option value="none">None</option>
        </select>
      </label>
      <div className={styles.checks}>
        {(['email', 'push'] as NotificationChannel[]).map(channel => (
          <label key={channel}>
            <input type="checkbox" checked={channels.includes(channel)} onChange={() => toggleChannel(channel)} />
            <span>{channel}</span>
          </label>
        ))}
      </div>
      <Button type="submit" loading={mutation.isPending} fullWidth>Save Changes</Button>
    </form>
  )
}
