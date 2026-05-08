import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import styles from './NotFound.module.css'

export function NotFound() {
  return (
    <Card className={styles.card}>
      <h1>Page not found</h1>
      <Link to="/">Back home</Link>
    </Card>
  )
}
