import React, { useState, useRef, useEffect } from 'react'
import styles from './Input.module.css'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string | null
  hint?: string | null
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(props, ref) {
  const { label, error = null, hint = null, leftIcon, rightIcon, fullWidth = false, value, defaultValue, onChange, type = 'text', ...rest } = props
  const [focused, setFocused] = useState(false)
  const internalRef = useRef<HTMLInputElement | null>(null)
  const inputRef = (ref as React.RefObject<HTMLInputElement>) || internalRef

  const isFilled = (): boolean => {
    const currentVal = (inputRef && inputRef.current && inputRef.current.value) ?? value ?? defaultValue
    return Boolean(currentVal && String(currentVal).length > 0)
  }

  const [filled, setFilled] = useState<boolean>(Boolean(value ?? defaultValue))

  useEffect(() => {
    setFilled(isFilled())
  }, [value, defaultValue])

  return (
    <div className={`${styles.field} ${fullWidth ? styles.fullWidth : ''} ${filled ? styles.filled : ''} ${focused ? styles.focused : ''}`}>
      <div className={`${styles.control} ${error ? styles.error : ''}`}>
        {leftIcon ? <span className={styles.leftIcon}>{leftIcon}</span> : null}
        <input
          ref={inputRef as any}
          className={styles.input}
          type={type}
          aria-invalid={Boolean(error)}
          aria-label={label}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); setFilled(isFilled()) }}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          {...rest}
        />
        {rightIcon ? <span className={styles.rightIcon}>{rightIcon}</span> : null}
        <label className={styles.label}>{label}</label>
      </div>
      {error ? <div role="alert" className={styles.hint} style={{ color: 'var(--color-danger)' }}>{error}</div> : hint ? <div className={styles.hint}>{hint}</div> : null}
    </div>
  )
})

export default Input
