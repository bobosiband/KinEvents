import { Card } from '@/components/ui/Card'
import styles from './EmptyState.module.css'

interface EmptyStateProps {
  title: string
  message: string
}

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <Card className={styles.empty}>
      <h2>{title}</h2>
      <p>{message}</p>
    </Card>
  )
}
