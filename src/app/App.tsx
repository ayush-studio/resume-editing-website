import { lazy, Suspense, useEffect } from 'react'
import { useResumeStore } from '../state/resumeStore.ts'
import { Home } from '../ui/Home.tsx'

const Reading = lazy(() => import('../ui/Reading.tsx').then((module) => ({ default: module.Reading })))
const Paste = lazy(() => import('../ui/Paste.tsx').then((module) => ({ default: module.Paste })))
const Review = lazy(() => import('../ui/Review.tsx').then((module) => ({ default: module.Review })))
const EditorShell = lazy(() => import('../ui/EditorShell.tsx').then((module) => ({ default: module.EditorShell })))

export default function App() {
  const view = useResumeStore((state) => state.view)
  const dirty = useResumeStore((state) => state.dirty)

  useEffect(() => {
    const onLeave = (event: BeforeUnloadEvent) => {
      if (!dirty) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onLeave)
    return () => window.removeEventListener('beforeunload', onLeave)
  }, [dirty])

  let screen = <Home />
  if (view === 'reading') screen = <Reading />
  if (view === 'paste') screen = <Paste />
  if (view === 'review') screen = <Review />
  if (view === 'editor') screen = <EditorShell />

  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center text-muted">Opening the studio</div>}>
      {screen}
    </Suspense>
  )
}
