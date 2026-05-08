import styles from './Loader.module.css'

interface LoaderProps {
  label?: string
}

export function Loader({ label = 'Loading' }: LoaderProps) {
  return (
    <div className={styles.loader} role="status">
      <span className={styles.spinner} />
      <span>{label}</span>
    </div>
  )
}
