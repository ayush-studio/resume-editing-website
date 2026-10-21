import { useRef, useState } from 'react'
import { templateIds, templateLabels, type TemplateId } from '../model/resume.ts'
import { fileKind } from '../import/fileKind.ts'
import { leaveIfDirty, startBlank, useResumeStore } from '../state/resumeStore.ts'
import { applyImportResult } from './applyImport.ts'
import { Button } from './controls.tsx'

const blurbs: Record<TemplateId, string> = {
  editorial: 'One column, serif name, hairline rules.',
  split: 'Contact and skills in a narrow rail.',
  compact: 'Tighter type for a single page.',
}

function Mark() {
  return (
    <span className="grid h-8 w-8 place-items-center border border-ink bg-panel" aria-hidden="true">
      <span className="flex w-4 flex-col gap-1">
        <span className="h-px bg-accent" />
        <span className="h-px bg-ink" />
        <span className="h-px w-2/3 bg-ink" />
      </span>
    </span>
  )
}

export function Home() {
  const importError = useResumeStore((state) => state.importError)
  const setImportError = useResumeStore((state) => state.setImportError)
  const setView = useResumeStore((state) => state.setView)
  const setReadingLabel = useResumeStore((state) => state.setReadingLabel)
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  async function takeFile(file: File | undefined) {
    if (!file) return
    if (!fileKind(file)) {
      setImportError(
        file.name.toLowerCase().endsWith('.doc')
          ? 'Older .doc files need to be saved as .docx first.'
          : 'Use a PDF or Word (.docx) file.',
      )
      return
    }
    setImportError(null)
    setReadingLabel('Reading the file')
    setView('reading')
    try {
      const { readResumeFile } = await import('../import/readFile.ts')
      const result = await readResumeFile(file, setReadingLabel)
      applyImportResult(result, { name: file.name, kind: fileKind(file) ?? 'pdf', text: result.kind === 'unsupported' ? '' : result.text })
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'That file could not be read.')
      setView('home')
    }
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center gap-3 px-4 py-5 sm:px-8 lg:px-10">
        <Mark />
        <p className="text-lg tracking-tight">Resume Studio</p>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-16 sm:px-8 lg:px-10">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">In this browser</p>
        <h1 className="home-title mt-3 max-w-xl font-display text-ink">
          A resume you can start, revise, and print.
        </h1>
        <p className="mt-4 max-w-lg text-lg text-muted">
          Fill a blank page, or bring a PDF or Word file and correct what we find. The download is the save.
        </p>
        <div className="home-actions mt-8 sm:mt-10">
          <button
            type="button"
            className="rounded-lg border border-line bg-panel p-6 text-left transition hover:border-ink"
            onClick={() => startBlank('editorial')}
          >
            <p className="font-display text-3xl">Start blank</p>
            <p className="mt-2 text-sm text-muted">Open the editorial page and write each section yourself.</p>
          </button>
          <button
            type="button"
            className={`rounded-lg border bg-panel p-6 text-left transition ${dragging ? 'border-accent' : 'border-line hover:border-ink'}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault()
              setDragging(false)
              void takeFile(event.dataTransfer.files[0])
            }}
          >
            <p className="font-display text-3xl">Upload a resume</p>
            <p className="mt-2 text-sm text-muted">Drop a PDF or Word file. We read it here, then you edit the fields.</p>
          </button>
          <input
            ref={inputRef}
            className="hidden"
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(event) => {
              void takeFile(event.target.files?.[0])
              event.target.value = ''
            }}
          />
        </div>
        {importError ? <p className="mt-4 text-sm text-accent">{importError}</p> : null}
        <section className="mt-14">
          <h2 className="text-[11px] uppercase tracking-[0.18em] text-muted">Templates</h2>
          <div className="template-grid mt-4">
            {templateIds.map((template) => (
              <button
                key={template}
                type="button"
                className="rounded-lg border border-line bg-panel p-4 text-left transition hover:border-ink"
                onClick={() => startBlank(template)}
              >
                <TemplateThumb template={template} />
                <p className="mt-4 font-display text-2xl">{templateLabels[template]}</p>
                <p className="mt-1 text-sm text-muted">{blurbs[template]}</p>
              </button>
            ))}
          </div>
        </section>
        <p className="mt-12 max-w-xl text-sm text-muted">
          Files are processed in this browser and are not uploaded to a server. Closing the tab discards the draft.
        </p>
        <div className="mt-6">
          <Button
            tone="quiet"
            onClick={() =>
              leaveIfDirty(() => {
                setImportError(null)
                setView('paste')
              })
            }
          >
            Paste resume text
          </Button>
        </div>
      </main>
    </div>
  )
}

function TemplateThumb({ template }: { template: TemplateId }) {
  if (template === 'split') {
    return (
      <div className="flex h-28 overflow-hidden rounded-sm border border-line bg-white">
        <div className="w-1/3 border-r border-line p-2">
          <div className="h-2 w-10 bg-accent" />
          <div className="mt-2 h-1 w-8 bg-line" />
          <div className="mt-3 h-1 w-full bg-line" />
          <div className="mt-1 h-1 w-4/5 bg-line" />
        </div>
        <div className="flex-1 p-2">
          <div className="h-1.5 w-16 bg-ink" />
          <div className="mt-2 h-1 w-full bg-line" />
          <div className="mt-1 h-1 w-full bg-line" />
          <div className="mt-1 h-1 w-3/4 bg-line" />
        </div>
      </div>
    )
  }
  return (
    <div className="h-28 rounded-sm border border-line bg-white p-3">
      <div className={`h-2 bg-accent ${template === 'compact' ? 'w-16' : 'w-24'}`} />
      <div className="mt-2 h-px w-full bg-line" />
      <div className="mt-2 h-1 w-full bg-line" />
      <div className="mt-1 h-1 w-11/12 bg-line" />
      <div className="mt-1 h-1 w-3/4 bg-line" />
      {template === 'compact' ? <div className="mt-1 h-1 w-2/3 bg-line" /> : null}
    </div>
  )
}
