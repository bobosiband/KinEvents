interface LoaderProps {
  label?: string
}

export function Loader({ label = 'Loading' }: LoaderProps) {
  return (
    <div className="inline-flex items-center gap-2 text-sm text-muted-foreground" role="status">
      <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      <span>{label}</span>
    </div>
  )
}
