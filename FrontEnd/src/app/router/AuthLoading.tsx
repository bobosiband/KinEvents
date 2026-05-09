import { Loader } from '@/components/feedback/Loader/Loader'

export function AuthLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader />
    </div>
  )
}

