import React from 'react'
import styles from './Form.module.css'

/* ==================== INPUT ==================== */

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  hint?: string
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { error, hint, icon, iconPosition = 'left', className, ...rest },
  ref
) {
  return (
    <div className={`${styles.inputWrapper} ${error ? styles.hasError : ''}`}>
      {icon && iconPosition === 'left' && (
        <span className={`${styles.icon} ${styles.iconLeft}`} aria-hidden="true">
          {icon}
        </span>
      )}
      <input
        ref={ref}
        className={`${styles.input} ${icon ? styles.withIcon : ''} ${className || ''}`}
        {...rest}
        aria-invalid={!!error}
        aria-describedby={error ? `${rest.id}-error` : hint ? `${rest.id}-hint` : undefined}
      />
      {icon && iconPosition === 'right' && (
        <span className={`${styles.icon} ${styles.iconRight}`} aria-hidden="true">
          {icon}
        </span>
      )}
      {error && (
        <span className={styles.error} id={`${rest.id}-error`}>
          {error}
        </span>
      )}
      {hint && !error && (
        <span className={styles.hint} id={`${rest.id}-hint`}>
          {hint}
        </span>
      )}
    </div>
  )
})

Input.displayName = 'Input'

/* ==================== LABEL ==================== */

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { required, children, className, ...rest },
  ref
) {
  return (
    <label ref={ref} className={`${styles.label} ${className || ''}`} {...rest}>
      {children}
      {required && <span className={styles.required} aria-label="required">*</span>}
    </label>
  )
})

Label.displayName = 'Label'

/* ==================== FORM GROUP ==================== */

export interface FormGroupProps {
  label?: string
  labelFor?: string
  required?: boolean
  error?: string
  hint?: string
  children: React.ReactNode
  className?: string
}

export const FormGroup: React.FC<FormGroupProps> = ({
  label,
  labelFor,
  required,
  error,
  hint,
  children,
  className,
}) => {
  return (
    <div className={`${styles.formGroup} ${error ? styles.hasError : ''} ${className || ''}`}>
      {label && (
        <Label htmlFor={labelFor} required={required}>
          {label}
        </Label>
      )}
      {children}
      {error && <span className={styles.error}>{error}</span>}
      {hint && !error && <span className={styles.hint}>{hint}</span>}
    </div>
  )
}

/* ==================== TEXTAREA ==================== */

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
  hint?: string
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { error, hint, className, ...rest },
  ref
) {
  return (
    <div className={`${styles.inputWrapper} ${error ? styles.hasError : ''}`}>
      <textarea
        ref={ref}
        className={`${styles.textarea} ${className || ''}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${rest.id}-error` : hint ? `${rest.id}-hint` : undefined}
        {...rest}
      />
      {error && (
        <span className={styles.error} id={`${rest.id}-error`}>
          {error}
        </span>
      )}
      {hint && !error && (
        <span className={styles.hint} id={`${rest.id}-hint`}>
          {hint}
        </span>
      )}
    </div>
  )
})

TextArea.displayName = 'TextArea'

/* ==================== CHECKBOX ==================== */

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, className, ...rest },
  ref
) {
  return (
    <div className={styles.checkboxWrapper}>
      <input
        ref={ref}
        type="checkbox"
        className={`${styles.checkbox} ${className || ''}`}
        {...rest}
      />
      {label && (
        <label htmlFor={rest.id} className={styles.checkboxLabel}>
          {label}
        </label>
      )}
    </div>
  )
})

Checkbox.displayName = 'Checkbox'

/* ==================== SELECT ==================== */

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string
  hint?: string
  options: Array<{ value: string; label: string }>
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { error, hint, options, className, ...rest },
  ref
) {
  return (
    <div className={`${styles.inputWrapper} ${error ? styles.hasError : ''}`}>
      <select
        ref={ref}
        className={`${styles.select} ${className || ''}`}
        aria-invalid={!!error}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <span className={styles.error} id={`${rest.id}-error`}>
          {error}
        </span>
      )}
      {hint && !error && (
        <span className={styles.hint} id={`${rest.id}-hint`}>
          {hint}
        </span>
      )}
    </div>
  )
})

Select.displayName = 'Select'
