import React from 'react'

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  message?: string
  action?: React.ReactNode
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message, action }) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/60 p-8 text-center shadow-sm" role="status">
      {icon ? <div className="mb-4 text-4xl text-primary">{icon}</div> : null}
      <div className="text-lg font-semibold">{title}</div>
      {message ? <div className="mt-2 max-w-md text-sm text-muted-foreground">{message}</div> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export default EmptyState
