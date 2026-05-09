import React from 'react'

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
  const classes = ['rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20', error ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : '', className || ''].filter(Boolean).join(' ')

  return (
    <label className={["space-y-2", fullWidth ? 'w-full' : ''].filter(Boolean).join(' ')}>
      <span className="block text-sm font-medium">{label}</span>
      <span className={classes}>
        <select ref={ref} className="w-full bg-transparent outline-none" aria-invalid={Boolean(error)} {...rest}>
          {children}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
      </span>
      {error ? <span className="text-xs text-destructive" role="alert">{error}</span> : hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  )
})

export default Select