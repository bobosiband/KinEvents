import React from 'react'
import styles from './Divider.module.css'

export interface DividerProps extends React.HTMLAttributes<HTMLHRElement> {
  orientation?: 'horizontal' | 'vertical'
  label?: string
}

export const Divider: React.FC<DividerProps> = ({ orientation = 'horizontal', label, className, ...rest }) => {
  if (orientation === 'vertical') {
    return <span aria-hidden className={[styles.divider, styles.vertical, className || ''].filter(Boolean).join(' ')} {...rest} />
  }

  if (label) {
    return (
      <div className={[styles.labeled, className || ''].filter(Boolean).join(' ')} role="separator" aria-label={label} {...rest}>
        <span className={styles.line} />
        <span className={styles.label}>{label}</span>
        <span className={styles.line} />
      </div>
    )
  }

  return <hr className={[styles.divider, className || ''].filter(Boolean).join(' ')} aria-orientation="horizontal" {...rest} />
}

export default Divider
