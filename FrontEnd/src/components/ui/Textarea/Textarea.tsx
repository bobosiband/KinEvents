import React from 'react'

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
  const classes = [
    'w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20',
    error ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : '',
    className || '',
  ].filter(Boolean).join(' ')

  return (
    <label className={["space-y-2", fullWidth ? 'w-full' : ''].filter(Boolean).join(' ')}>
      <span className="block text-sm font-medium">{label}</span>
      <textarea ref={ref} className={classes} aria-invalid={Boolean(error)} {...rest} />
      {error ? <span className="text-xs text-destructive" role="alert">{error}</span> : null}
      {!error && hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  )
})

export default Textarea
