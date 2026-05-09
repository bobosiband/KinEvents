import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'
import { Button } from '@/components/ui/Button/Button'

function getMessage(error: unknown): string {
  if (isRouteErrorResponse(error)) return error.statusText || 'The page could not be loaded.'
  if (error instanceof Error) return error.message
  return 'The app hit an unexpected error.'
}

export function RouteError() {
  const error = useRouteError()

  return (
    <main className="min-h-[60vh] grid place-items-center px-4">
      <section className="max-w-md w-full rounded-2xl bg-card border border-border p-6 shadow-md" role="alert">
        <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
        <p className="text-sm text-muted-foreground mb-4">{getMessage(error)}</p>
        <Link to="/">
          <Button type="button">Back home</Button>
        </Link>
      </section>
    </main>
  )
}
