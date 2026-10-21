import { useEffect, useState } from 'react'

const query = '(min-width: 1180px)'

export function useWideStudio() {
  const [wide, setWide] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const media = window.matchMedia(query)
    const update = () => setWide(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return wide
}
