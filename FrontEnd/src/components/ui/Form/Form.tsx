import React from 'react'

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
    <div className="relative space-y-1">
      {icon && iconPosition === 'left' ? (
        <span className="pointer-events-none absolute left-3 top-3 text-muted-foreground" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <input
        ref={ref}
        className={[
          'w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20',
          icon ? (iconPosition === 'left' ? 'pl-10' : 'pr-10') : '',
          error ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : '',
          className || '',
        ].filter(Boolean).join(' ')}
        {...rest}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${rest.id}-error` : hint ? `${rest.id}-hint` : undefined}
      />
      {icon && iconPosition === 'right' ? (
        <span className="pointer-events-none absolute right-3 top-3 text-muted-foreground" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {error ? <span className="text-xs text-destructive" id={`${rest.id}-error`}>{error}</span> : null}
      {!error && hint ? <span className="text-xs text-muted-foreground" id={`${rest.id}-hint`}>{hint}</span> : null}
    </div>
  )
})

Input.displayName = 'Input'

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { required, children, className, ...rest },
  ref
) {
  return (
    <label ref={ref} className={["inline-flex items-center gap-1 text-sm font-medium", className || ''].filter(Boolean).join(' ')} {...rest}>
      {children}
      {required ? <span className="text-destructive" aria-label="required">*</span> : null}
    </label>
  )
})

Label.displayName = 'Label'

export interface FormGroupProps {
  label?: string
  labelFor?: string
  required?: boolean
  error?: string
  hint?: string
  children: React.ReactNode
  className?: string
}

export const FormGroup: React.FC<FormGroupProps> = ({ label, labelFor, required, error, hint, children, className }) => {
  return (
    <div className={["space-y-2", className || ''].filter(Boolean).join(' ')}>
      {label ? (
        <Label htmlFor={labelFor} required={required}>
          {label}
        </Label>
      ) : null}
      {children}
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
      {!error && hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </div>
  )
}

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
  hint?: string
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { error, hint, className, ...rest },
  ref
) {
  return (
    <div className="space-y-1">
      <textarea
        ref={ref}
        className={[
          'min-h-28 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20',
          error ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : '',
          className || '',
        ].filter(Boolean).join(' ')}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${rest.id}-error` : hint ? `${rest.id}-hint` : undefined}
        {...rest}
      />
      {error ? <span className="text-xs text-destructive" id={`${rest.id}-error`}>{error}</span> : null}
      {!error && hint ? <span className="text-xs text-muted-foreground" id={`${rest.id}-hint`}>{hint}</span> : null}
    </div>
  )
})

TextArea.displayName = 'TextArea'

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, className, ...rest },
  ref
) {
  return (
    <div className="flex items-center gap-2">
      <input
        ref={ref}
        type="checkbox"
        className={['h-4 w-4 rounded border-border text-primary focus:ring-primary/20', className || ''].filter(Boolean).join(' ')}
        {...rest}
      />
      {label ? <label htmlFor={rest.id} className="text-sm text-foreground">{label}</label> : null}
    </div>
  )
})

Checkbox.displayName = 'Checkbox'

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
    <div className="space-y-1">
      <select
        ref={ref}
        className={[
          'w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20',
          error ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : '',
          className || '',
        ].filter(Boolean).join(' ')}
        aria-invalid={Boolean(error)}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <span className="text-xs text-destructive" id={`${rest.id}-error`}>{error}</span> : null}
      {!error && hint ? <span className="text-xs text-muted-foreground" id={`${rest.id}-hint`}>{hint}</span> : null}
    </div>
  )
})

Select.displayName = 'Select'
