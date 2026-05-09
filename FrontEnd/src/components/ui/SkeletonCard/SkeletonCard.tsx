import React from 'react'

export interface SkeletonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  showMedia?: boolean
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ showMedia = true, className, ...rest }) => {
  return (
    <div className={["rounded-3xl border border-border bg-card p-4 shadow-sm animate-pulse space-y-4", className || ''].filter(Boolean).join(' ')} {...rest}>
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-muted" aria-hidden />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/5 rounded-full bg-muted" aria-hidden />
          <div className="h-3 w-2/5 rounded-full bg-muted" aria-hidden />
        </div>
      </div>
      {showMedia ? <div className="h-40 rounded-2xl bg-muted" aria-hidden /> : null}
      <div className="space-y-2">
        <div className="h-3 w-full rounded-full bg-muted" aria-hidden />
        <div className="h-3 w-5/6 rounded-full bg-muted" aria-hidden />
      </div>
      <div className="flex gap-2">
        <div className="h-8 w-20 rounded-full bg-muted" aria-hidden />
        <div className="h-8 w-16 rounded-full bg-muted" aria-hidden />
      </div>
    </div>
  )
}

export default SkeletonCard