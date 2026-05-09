import React from 'react'
import styles from './SkeletonCard.module.css'

export interface SkeletonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  showMedia?: boolean
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ showMedia = true, className, ...rest }) => {
  return (
    <div className={[styles.card, className || ''].filter(Boolean).join(' ')} {...rest}>
      <div className={styles.header}>
        <div className={`${styles.avatar} skeleton`} aria-hidden />
        <div style={{ flex: 1, display: 'grid', gap: 'var(--space-2)' }}>
          <div className={`${styles.line} ${styles.lineMed} skeleton`} aria-hidden />
          <div className={`${styles.line} ${styles.lineShort} skeleton`} aria-hidden />
        </div>
      </div>
      {showMedia ? <div className={`${styles.media} skeleton`} aria-hidden /> : null}
      <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
        <div className={`${styles.line} ${styles.lineLong} skeleton`} aria-hidden />
        <div className={`${styles.line} ${styles.lineMed} skeleton`} aria-hidden />
      </div>
      <div className={styles.footer}>
        <div className={`${styles.chip} skeleton`} aria-hidden />
        <div className={`${styles.chip} skeleton`} aria-hidden />
      </div>
    </div>
  )
}

export default SkeletonCard