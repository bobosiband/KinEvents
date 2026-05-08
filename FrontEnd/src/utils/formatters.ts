import { format, formatDistanceToNow } from 'date-fns'

export function formatEventDate(date: string): string {
  return format(new Date(date), 'EEE, MMM d • p')
}

export function fromNow(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}
