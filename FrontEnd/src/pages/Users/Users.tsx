import { useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Loader } from '@/components/feedback/Loader/Loader'
import { useUsers } from '@/features/users/hooks/useUsers'
import type { User } from '@/features/auth/types/auth.types'

export function Users() {
  const navigate = useNavigate()
  const { data = [], isLoading } = useUsers()

  if (isLoading) return <Loader />

  const roleColor: Record<User['role'], 'primary' | 'accent' | 'success'> = {
    admin: 'primary',
    manager: 'accent',
    member: 'success',
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Family Members</h1>
      {data.length === 0 ? (
        <EmptyState title="No members yet" message="Waiting for family members to join." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map(user => (
            <Card key={user.id} className="cursor-pointer space-y-3" onClick={() => navigate(`/users/${user.id}`)}>
              <Avatar name={user.name} size="lg" />
              <h3 className="text-lg font-semibold">{user.name}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <Badge tone={roleColor[user.role]}>{user.role}</Badge>
              {user.birthday && <p className="text-sm text-muted-foreground">🎂 {user.birthday}</p>}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
