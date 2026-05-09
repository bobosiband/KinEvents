interface ErrorMessageProps {
  title?: string
  message: string
}

export function ErrorMessage({ title = 'Something went wrong', message }: ErrorMessageProps) {
  return (
    <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive" role="alert">
      <strong className="block font-semibold">{title}</strong>
      <span className="mt-1 block text-destructive/80">{message}</span>
    </div>
  )
}
