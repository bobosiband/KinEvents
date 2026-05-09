import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: number | string
  icon?: ReactNode
}

export function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <article className="bg-card rounded-2xl p-5 shadow-sm">
      {icon ? <div className="mb-2">{icon}</div> : null}
      <p className="text-3xl font-bold mb-0.5">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </article>
  )
}
