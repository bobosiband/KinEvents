import React, { type ReactNode } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import styles from './ErrorBoundary.module.css'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.container}>
          <Card className={styles.card}>
            <div className={styles.content}>
              <h1>Something went wrong</h1>
              <p>We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.</p>
              {import.meta.env.DEV && this.state.error && (
                <details className={styles.details}>
                  <summary>Error details</summary>
                  <pre>{this.state.error.toString()}</pre>
                </details>
              )}
            </div>
            <div className={styles.actions}>
              <Button onClick={this.resetError}>Try again</Button>
              <Button variant="secondary" onClick={() => window.location.href = '/'}>Go home</Button>
            </div>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
