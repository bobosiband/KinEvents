import React from 'react'
import styles from './Select.module.css'

export interface SelectOption {
  label: string
  value: string
  disabled?: boolean
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: SelectOption[]
  error?: string | null
  hint?: string | null
  fullWidth?: boolean
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, options, error = null, hint = null, fullWidth = false, className, children, ...rest },
  ref
) {
  const classes = [styles.control, error ? styles.error : '', className || ''].filter(Boolean).join(' ')

  return (
    <label className={[styles.field, fullWidth ? styles.fullWidth : ''].filter(Boolean).join(' ')}>
      <span className={styles.label}>{label}</span>
      <span className={classes}>
        <select ref={ref} className={styles.select} aria-invalid={Boolean(error)} {...rest}>
          {children}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
      </span>
      {error ? <span className={styles.hint} role="alert" style={{ color: 'var(--color-danger)' }}>{error}</span> : hint ? <span className={styles.hint}>{hint}</span> : null}
    </label>
  )
})

export default Select