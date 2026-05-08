import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import styles from './RouteError.module.css'

function getMessage(error: unknown): string {
  if (isRouteErrorResponse(error)) return error.statusText || 'The page could not be loaded.'
  if (error instanceof Error) return error.message
  return 'The app hit an unexpected error.'
}

export function RouteError() {
  const error = useRouteError()

  return (
    <main className={styles.page}>
      <section className={styles.card} role="alert">
        <h1>Something went wrong</h1>
        <p>{getMessage(error)}</p>
        <Link to="/">
          <Button type="button">Back home</Button>
        </Link>
      </section>
    </main>
  )
}
