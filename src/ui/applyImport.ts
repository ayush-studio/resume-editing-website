import { mapText } from '../import/mapText.ts'
import type { ImportResult } from '../import/readFile.ts'
import type { SourceText } from '../state/resumeStore.ts'
import { useResumeStore } from '../state/resumeStore.ts'

export function applyImportResult(
  result: ImportResult,
  source: SourceText | null,
) {
  const store = useResumeStore.getState()
  if (result.kind === 'unsupported') {
    store.setImportError(result.message)
    store.setView('home')
    return
  }
  if (result.kind === 'no-text') {
    store.setImportError(null)
    store.setView('paste')
    return
  }
  store.replaceResume(result.resume, {
    dirty: true,
    restored: result.kind === 'exact',
    source,
    view: result.kind === 'exact' ? 'editor' : 'review',
    selected: 'profile',
  })
}

export function rereadSource() {
  const { source, resume, replaceResume } = useResumeStore.getState()
  if (!source?.text.trim()) return
  const mapped = mapText(source.text, resume.appearance.template)
  mapped.appearance = { ...resume.appearance }
  replaceResume(mapped, {
    dirty: true,
    restored: false,
    source,
    view: 'review',
    selected: 'profile',
  })
}
