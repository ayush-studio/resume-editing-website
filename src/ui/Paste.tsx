import { useState } from 'react'
import { resumeFromPaste } from '../import/readFile.ts'
import { leaveIfDirty, startBlank, useResumeStore } from '../state/resumeStore.ts'
import { applyImportResult } from './applyImport.ts'
import { Button, inputClass } from './controls.tsx'

export function Paste() {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="mx-auto min-h-svh max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted">No text layer</p>
      <h1 className="mt-2 font-display text-3xl sm:text-4xl">This PDF has no selectable text</h1>
      <p className="mt-3 max-w-xl text-muted">
        Scans and photos cannot be read here. Start from a blank template, or paste the resume text and we will map it into fields.
      </p>
      <textarea
        className={`${inputClass} mt-6 min-h-64`}
        value={text}
        placeholder="Paste the resume text"
        onChange={(event) => setText(event.target.value)}
      />
      {error ? <p className="mt-3 text-sm text-accent">{error}</p> : null}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          onClick={() => {
            const result = resumeFromPaste(text)
            if (result.kind === 'no-text') {
              setError('Paste the resume text first.')
              return
            }
            applyImportResult(result, { name: 'Pasted text', kind: 'paste', text })
          }}
        >
          Map this text
        </Button>
        <Button tone="quiet" onClick={() => leaveIfDirty(() => startBlank('editorial'))}>
          Start blank
        </Button>
        <Button tone="ghost" onClick={() => leaveIfDirty(() => useResumeStore.getState().resetToHome())}>
          Back
        </Button>
      </div>
    </div>
  )
}
