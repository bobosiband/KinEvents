import { useEffect, useState } from 'react'

export function useMobile(maxWidth = 480): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(`(max-width: ${maxWidth}px)`).matches)

  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${maxWidth}px)`)
    const onChange = () => setMatches(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [maxWidth])

  return matches
}
