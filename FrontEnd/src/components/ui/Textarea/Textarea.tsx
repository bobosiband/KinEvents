import React from 'react'
import styles from './Textarea.module.css'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string | null
  hint?: string | null
  fullWidth?: boolean
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error = null, hint = null, fullWidth = false, className, ...rest },
  ref
) {
  const classes = [styles.control, error ? styles.error : '', className || ''].filter(Boolean).join(' ')

  return (
    <label className={[styles.field, fullWidth ? styles.fullWidth : ''].filter(Boolean).join(' ')}>
      <span className={styles.label}>{label}</span>
      <textarea ref={ref} className={classes} aria-invalid={Boolean(error)} {...rest} />
      {error ? <span className={styles.hint} role="alert" style={{ color: 'var(--color-danger)' }}>{error}</span> : hint ? <span className={styles.hint}>{hint}</span> : null}
    </label>
  )
})

export default Textarea