import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Divider } from '@/components/ui/Divider'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useProfile } from '@/features/users/hooks/useProfile'
import type { NotificationChannel, NotificationLevel } from '@/features/auth/types/auth.types'
import { Shield, LogOut } from 'lucide-react'

export function Profile() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const setAuth = useAuthStore(state => state.setAuth)
  const clearAuth = useAuthStore(state => state.clearAuth)
  const token = useAuthStore(state => state.token)
  const mutation = useProfile(user?.id || '')

  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [birthday, setBirthday] = useState(user?.birthday || '')
  const [level, setLevel] = useState<NotificationLevel>(user?.notificationPrefs.level || 'important')
  const [channels, setChannels] = useState<NotificationChannel[]>(user?.notificationPrefs.channels || ['email'])
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    setName(user?.name || '')
    setEmail(user?.email || '')
    setBirthday(user?.birthday || '')
    setLevel(user?.notificationPrefs.level || 'important')
    setChannels(user?.notificationPrefs.channels || ['email'])
  }, [user])

  if (!user) return null

  const toggleChannel = (channel: NotificationChannel) => {
    setChannels(current => current.includes(channel) ? current.filter(item => item !== channel) : [...current, channel])
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = 'Name is required.'
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Enter a valid email address.'
    }
    if (birthday && !/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
      newErrors.birthday = 'Use YYYY-MM-DD format.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!validate()) return

    mutation.mutate(
      { name, email: email.trim().toLowerCase(), birthday, notificationPrefs: { level, channels } },
      {
        onSuccess: (response) => {
          const updatedUser = response.user
          if (token) {
            setAuth(updatedUser, token)
          }
          toast.success('Profile saved')
        },
        onError: (err) => {
          if (err.message.includes('Email already in use')) {
            setErrors(prev => ({ ...prev, email: 'This email is already taken.' }))
          } else {
            toast.error(err.message || 'Failed to save profile')
          }
        },
      },
    )
  }

  const handleLogout = () => {
    clearAuth()
    navigate('/', { replace: true })
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <Card className="space-y-3">
        <Avatar name={user.name} size="xl" />
        <h1 className="text-2xl font-bold">{user.name}</h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
        <Badge tone="primary">{user.role}</Badge>
      </Card>

      {user.role === 'admin' && (
        <Card className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Admin Panel</p>
              <p className="text-xs text-muted-foreground">Manage users, events and access</p>
            </div>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={() => navigate('/admin')}>
            Open
          </Button>
        </Card>
      )}

      <form className="space-y-4" onSubmit={submit}>
        <Input label="Name" value={name} onChange={(event) => setName(event.target.value)} error={errors.name} fullWidth />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
          hint="Changing email will refresh your session token"
          fullWidth
        />
        <Input
          label="Birthday"
          value={birthday}
          onChange={(event) => setBirthday(event.target.value)}
          error={errors.birthday}
          hint="YYYY-MM-DD"
          fullWidth
        />
        <label className="space-y-2 block">
          <span className="text-sm font-medium">Notification level</span>
          <select
            value={level}
            onChange={(event) => setLevel(event.target.value as NotificationLevel)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="important">Important</option>
            <option value="none">None</option>
          </select>
        </label>
        <div className="flex flex-wrap gap-3">
          {(['email', 'push'] as NotificationChannel[]).map((channel) => (
            <label
              key={channel}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm cursor-pointer"
            >
              <input
                type="checkbox"
                checked={channels.includes(channel)}
                onChange={() => toggleChannel(channel)}
              />
              <span>{channel}</span>
            </label>
          ))}
        </div>
        <Button type="submit" loading={mutation.isPending} fullWidth>
          Save Changes
        </Button>
      </form>

      <Divider />

      <Card className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Account</h2>
        <Button
          type="button"
          variant="ghost"
          fullWidth
          icon={<LogOut className="w-4 h-4" />}
          onClick={handleLogout}
          className="text-destructive hover:bg-destructive/10 justify-start"
        >
          Sign Out
        </Button>
      </Card>
    </div>
  )
}
