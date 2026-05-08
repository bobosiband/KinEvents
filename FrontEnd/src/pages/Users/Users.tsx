import { useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Loader } from '@/components/feedback/Loader/Loader'
import { useUsers } from '@/features/users/hooks/useUsers'
import type { User } from '@/features/auth/types/auth.types'
import styles from './Users.module.css'

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
    <div className={styles.page}>
      <h1>Family Members</h1>
      {data.length === 0 ? (
        <EmptyState title="No members yet" message="Waiting for family members to join." />
      ) : (
        <div className={styles.grid}>
          {data.map(user => (
            <Card key={user.id} className={styles.card} onClick={() => navigate(`/users/${user.id}`)}>
              <Avatar name={user.name} size="lg" />
              <h3>{user.name}</h3>
              <p>{user.email}</p>
              <Badge tone={roleColor[user.role]}>{user.role}</Badge>
              {user.birthday && <p className={styles.birthday}>🎂 {user.birthday}</p>}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
