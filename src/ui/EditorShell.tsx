import { useState } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  accentIds,
  accents,
  sectionLabels,
  templateIds,
  templateLabels,
  type SectionId,
  type TemplateId,
} from '../model/resume.ts'
import { leaveIfDirty, useResumeStore } from '../state/resumeStore.ts'
import { rereadSource } from './applyImport.ts'
import { Button } from './controls.tsx'
import { PreviewPane } from './PreviewPane.tsx'
import { SectionForm } from './sections/Forms.tsx'
import { useWideStudio } from './useWideStudio.ts'

function SortableSection({ id }: { id: SectionId }) {
  const selected = useResumeStore((state) => state.selected === id)
  const select = useResumeStore((state) => state.select)
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  return (
    <button
      ref={setNodeRef}
      type="button"
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`studio-section rounded-lg px-3 py-2 text-left text-sm ${selected ? 'bg-accent text-white' : 'hover:bg-[#efe8dc]'}`}
      onClick={() => select(id)}
      {...attributes}
      {...listeners}
    >
      {sectionLabels[id]}
    </button>
  )
}

export function EditorShell() {
  const resume = useResumeStore((state) => state.resume)
  const selected = useResumeStore((state) => state.selected)
  const select = useResumeStore((state) => state.select)
  const commit = useResumeStore((state) => state.commit)
  const undo = useResumeStore((state) => state.undo)
  const redo = useResumeStore((state) => state.redo)
  const past = useResumeStore((state) => state.past.length)
  const future = useResumeStore((state) => state.future.length)
  const previewOpen = useResumeStore((state) => state.previewOpen)
  const setPreviewOpen = useResumeStore((state) => state.setPreviewOpen)
  const restoredNote = useResumeStore((state) => state.restoredNote)
  const source = useResumeStore((state) => state.source)
  const nameError = useResumeStore((state) => state.nameError)
  const requireName = useResumeStore((state) => state.requireName)
  const downloadError = useResumeStore((state) => state.downloadError)
  const setDownloadError = useResumeStore((state) => state.setDownloadError)
  const [busy, setBusy] = useState<'pdf' | 'docx' | null>(null)
  const wide = useWideStudio()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    commit((current) => {
      const from = current.sectionOrder.indexOf(active.id as SectionId)
      const to = current.sectionOrder.indexOf(over.id as SectionId)
      if (from < 0 || to < 0) return current
      return { ...current, sectionOrder: arrayMove(current.sectionOrder, from, to) }
    })
  }

  async function download(kind: 'pdf' | 'docx') {
    if (!resume.profile.fullName.trim()) {
      requireName()
      return
    }
    setBusy(kind)
    setDownloadError(null)
    try {
      const exporter = await import('../export/download.tsx')
      if (kind === 'pdf') await exporter.downloadPdf(resume)
      else await exporter.downloadDocx(resume)
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'The file could not be downloaded.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className={`studio bg-desk ${previewOpen ? 'previewing' : ''}`}>
      <header className="studio-header z-20">
        <button type="button" className="studio-brand text-left" onClick={() => leaveIfDirty(() => useResumeStore.getState().resetToHome())}>
          <span className="block text-sm tracking-tight">Resume Studio</span>
          <span className="hidden text-[11px] text-muted sm:block">This draft lives in this tab. Download before you leave.</span>
        </button>
        <div className="studio-tools">
          {templateIds.map((template) => (
            <Button
              key={template}
              tone={resume.appearance.template === template ? 'solid' : 'quiet'}
              onClick={() =>
                commit((current) => ({
                  ...current,
                  appearance: { ...current.appearance, template: template as TemplateId },
                }))
              }
            >
              {templateLabels[template]}
            </Button>
          ))}
          <div className="flex items-center gap-1" aria-label="Accent">
            {accentIds.map((accent) => (
              <button
                key={accent}
                type="button"
                aria-label={accents[accent].label}
                className={`h-11 w-11 rounded-full border min-[1180px]:h-6 min-[1180px]:w-6 ${resume.appearance.accent === accent ? 'border-ink' : 'border-transparent'}`}
                style={{ background: accents[accent].value }}
                onClick={() =>
                  commit((current) => ({
                    ...current,
                    appearance: { ...current.appearance, accent },
                  }))
                }
              />
            ))}
          </div>
          <Button tone="ghost" disabled={past === 0} onClick={undo}>
            Undo
          </Button>
          <Button tone="ghost" disabled={future === 0} onClick={redo}>
            Redo
          </Button>
        </div>
        <div className="studio-downloads">
          <Button tone="quiet" disabled={busy !== null} onClick={() => void download('docx')}>
            {busy === 'docx' ? 'Preparing Word' : 'Download Word'}
          </Button>
          <Button disabled={busy !== null} onClick={() => void download('pdf')}>
            {busy === 'pdf' ? 'Preparing PDF' : 'Download PDF'}
          </Button>
        </div>
        {downloadError || nameError ? (
          <p className="basis-full text-sm text-accent">
            {nameError ? 'Add a name before downloading.' : downloadError}
          </p>
        ) : null}
      </header>
      <div className="studio-grid">
        <nav className="studio-nav" aria-label="Resume sections">
          <button
            type="button"
            className={`rounded-lg px-3 py-2 text-left text-sm ${selected === 'profile' ? 'bg-accent text-white' : 'hover:bg-[#efe8dc]'}`}
            onClick={() => select('profile')}
          >
            Profile
          </button>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext
              items={resume.sectionOrder}
              strategy={wide ? verticalListSortingStrategy : horizontalListSortingStrategy}
            >
              {resume.sectionOrder.map((id) => (
                <SortableSection key={id} id={id} />
              ))}
            </SortableContext>
          </DndContext>
        </nav>
        <div className="studio-form bg-panel">
          {restoredNote ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 text-sm sm:px-5">
              <p>Loaded the structured resume from this file.</p>
              <Button tone="quiet" disabled={!source?.text.trim()} onClick={rereadSource}>
                Re-read the visible text
              </Button>
            </div>
          ) : null}
          <SectionForm id={selected} />
        </div>
        <aside className={`studio-preview ${previewOpen ? 'is-open' : ''}`}>
          <div className="min-h-0 min-w-0 flex-1">
            <PreviewPane onClose={() => setPreviewOpen(false)} />
          </div>
        </aside>
      </div>
      <div className="studio-dock">
        <Button tone="quiet" onClick={() => setPreviewOpen(true)}>
          Preview
        </Button>
        <Button tone="quiet" disabled={busy !== null} onClick={() => void download('docx')}>
          {busy === 'docx' ? 'Word…' : 'Word'}
        </Button>
        <Button disabled={busy !== null} onClick={() => void download('pdf')}>
          {busy === 'pdf' ? 'PDF…' : 'PDF'}
        </Button>
      </div>
    </div>
  )
}
