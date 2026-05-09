import React from 'react'
import styles from './Loader.module.css'

export interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string
  inline?: boolean
  fullPage?: boolean
}

export const Loader: React.FC<LoaderProps> = ({ label = 'Loading…', inline = false, fullPage = false, className, ...rest }) => {
  if (fullPage) {
    return (
      <div className={styles.fullPage} {...rest}>
        <div className={styles.card}>
          <span className={styles.spinner} aria-hidden />
          <div style={{ color: 'var(--color-text-primary)' }}>{label}</div>
        </div>
      </div>
    )
  }

  return (
    <div className={inline ? styles.loaderInline : ''} aria-live="polite" {...rest}>
      <span className={styles.spinner} aria-hidden />
      {label ? <span className={styles.label}>{label}</span> : null}
    </div>
  )
}

export default Loader
