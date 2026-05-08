import styles from './StatCard.module.css'

interface StatCardProps {
  label: string
  value: number
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <article className={styles.card}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}
