import React from 'react'

export interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string
  inline?: boolean
  fullPage?: boolean
}

export const Loader: React.FC<LoaderProps> = ({ label = 'Loading…', inline = false, fullPage = false, className, ...rest }) => {
  if (fullPage) {
    return (
      <div className="grid min-h-[50vh] place-items-center p-4" {...rest}>
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-border bg-card px-6 py-8 shadow-sm">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-primary" aria-hidden />
          <div className="text-sm font-medium text-foreground">{label}</div>
        </div>
      </div>
    )
  }

  return (
    <div className={["inline-flex items-center gap-2", inline ? 'text-sm' : 'text-base', className || ''].filter(Boolean).join(' ')} aria-live="polite" {...rest}>
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-primary" aria-hidden />
      {label ? <span className="text-muted-foreground">{label}</span> : null}
    </div>
  )
}

export default Loader
