import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useRequestAccess } from '@/features/auth/hooks/useRequestAccess'
import styles from './RequestAccess.module.css'

export function RequestAccess() {
  const mutation = useRequestAccess()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim() || !email.includes('@')) {
      setError('Name and valid email are required.')
      return
    }
    setError('')
    mutation.mutate({ name, email, message })
  }

  if (mutation.isSuccess) {
    return (
      <section className={styles.card}>
        <h1>Your request has been sent!</h1>
        <p>An admin will review it.</p>
        <Link to="/login">Back to Login</Link>
      </section>
    )
  }

  return (
    <section className={styles.card}>
      <h1>Request Access</h1>
      <form onSubmit={submit}>
        <Input label="Name" value={name} onChange={event => setName(event.target.value)} fullWidth />
        <Input label="Email" type="email" value={email} onChange={event => setEmail(event.target.value)} error={error} fullWidth />
        <label className={styles.textarea}>
          <span>Message</span>
          <textarea value={message} onChange={event => setMessage(event.target.value)} />
        </label>
        <Button type="submit" loading={mutation.isPending} fullWidth>Send Request</Button>
      </form>
      <Link to="/login">Back to Login</Link>
    </section>
  )
}
