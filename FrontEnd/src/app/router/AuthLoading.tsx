import { Loader } from '@/components/feedback/Loader/Loader'

export function AuthLoading() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader />
    </div>
  )
}

