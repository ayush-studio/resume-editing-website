import { reviewNotes } from '../model/resume.ts'
import { leaveIfDirty, useResumeStore } from '../state/resumeStore.ts'
import { Button } from './controls.tsx'
import { AllSections } from './sections/Forms.tsx'

export function Review() {
  const resume = useResumeStore((state) => state.resume)
  const setView = useResumeStore((state) => state.setView)
  const notes = reviewNotes(resume)

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 flex flex-wrap items-end justify-between gap-3 border-b border-line bg-desk/95 px-4 py-4 backdrop-blur sm:px-5">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Review</p>
          <h1 className="font-display text-2xl sm:text-3xl">Check what we found</h1>
        </div>
        <div className="review-actions">
          <Button tone="ghost" onClick={() => leaveIfDirty(() => useResumeStore.getState().resetToHome())}>
            Back to start
          </Button>
          <Button onClick={() => setView('editor')}>Continue to editor</Button>
        </div>
      </header>
      <div className="review-layout mx-auto max-w-6xl px-4 py-5 sm:py-6">
        <aside className="review-notes h-fit rounded-lg border border-line bg-panel p-4">
          <p className="text-sm text-muted">
            Columns, tables, and text boxes often arrive out of order. Correct the fields, then continue.
          </p>
          {notes.length ? (
            <ul className="mt-4 grid gap-2 text-sm">
              {notes.map((note) => (
                <li key={note.id} className="border-l-2 border-accent pl-3">
                  {note.message}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm">The main sections all have something in them.</p>
          )}
        </aside>
        <div className="overflow-hidden rounded-lg border border-line bg-panel">
          <AllSections />
        </div>
      </div>
    </div>
  )
}
