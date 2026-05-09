import { Card } from '@/components/ui/Card'

interface EmptyStateProps {
  title: string
  message: string
}

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <Card className="text-center py-10" variant="flat">
      <h2 className="text-lg font-semibold mb-1">{title}</h2>
      <p className="text-sm text-muted-foreground">{message}</p>
    </Card>
  )
}
