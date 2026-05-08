import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import styles from './Input.module.css'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
}

export function Input({ label, error, hint, leftIcon, rightIcon, fullWidth = false, id, className = '', ...props }: InputProps) {
  const generatedId = useId()
  const inputId = id || generatedId
  const classNames = [styles.field, fullWidth ? styles.fullWidth : '', error ? styles.invalid : '', className].join(' ')

  return (
    <label className={classNames} htmlFor={inputId}>
      <span className={styles.control}>
        {leftIcon ? <span className={styles.icon}>{leftIcon}</span> : null}
        <input id={inputId} placeholder=" " aria-invalid={Boolean(error)} {...props} />
        <span className={styles.label}>{label}</span>
        {rightIcon ? <span className={styles.icon}>{rightIcon}</span> : null}
      </span>
      {error ? <span className={styles.error}>{error}</span> : null}
      {!error && hint ? <span className={styles.hint}>{hint}</span> : null}
    </label>
  )
}
