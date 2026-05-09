import React from 'react'

export interface DividerProps extends React.HTMLAttributes<HTMLHRElement> {
  orientation?: 'horizontal' | 'vertical'
  label?: string
}

export const Divider: React.FC<DividerProps> = ({ orientation = 'horizontal', label, className, ...rest }) => {
  if (orientation === 'vertical') {
    return <span aria-hidden className={["inline-block w-px self-stretch bg-border", className || ''].filter(Boolean).join(' ')} {...rest} />
  }

  if (label) {
    return (
      <div className={["flex items-center gap-3", className || ''].filter(Boolean).join(' ')} role="separator" aria-label={label} {...rest}>
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
        <span className="h-px flex-1 bg-border" />
      </div>
    )
  }

  return <hr className={["border-0 h-px bg-border", className || ''].filter(Boolean).join(' ')} aria-orientation="horizontal" {...rest} />
}

export default Divider
