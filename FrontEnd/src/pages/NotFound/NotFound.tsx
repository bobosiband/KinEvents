import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'

export function NotFound() {
  return (
    <Card className="max-w-md mx-auto text-center space-y-4">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <Link to="/" className="text-primary font-medium">Back home</Link>
    </Card>
  )
}
