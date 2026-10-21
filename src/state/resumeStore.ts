import { create } from 'zustand'
import {
  emptyResume,
  normalizeResume,
  type Resume,
  type Selectable,
  type TemplateId,
} from '../model/resume.ts'

const HISTORY_LIMIT = 50
const COALESCE_MS = 500

export type StudioView = 'home' | 'reading' | 'review' | 'editor' | 'paste'

export type SourceText = {
  name: string
  kind: 'pdf' | 'docx' | 'paste'
  text: string
}

type ResumeState = {
  resume: Resume
  past: Resume[]
  future: Resume[]
  lastCommitAt: number
  view: StudioView
  selected: Selectable
  dirty: boolean
  readingLabel: string
  importError: string | null
  downloadError: string | null
  restoredNote: boolean
  source: SourceText | null
  previewOpen: boolean
  nameError: boolean
  setView: (view: StudioView) => void
  select: (selected: Selectable) => void
  setPreviewOpen: (open: boolean) => void
  setReadingLabel: (label: string) => void
  setImportError: (message: string | null) => void
  setDownloadError: (message: string | null) => void
  requireName: () => void
  clearNameError: () => void
  replaceResume: (
    resume: Resume,
    options?: {
      dirty?: boolean
      restored?: boolean
      source?: SourceText | null
      view?: StudioView
      selected?: Selectable
    },
  ) => void
  commit: (updater: (resume: Resume) => Resume) => void
  undo: () => void
  redo: () => void
  resetToHome: () => void
}

export const useResumeStore = create<ResumeState>((set) => ({
  resume: emptyResume(),
  past: [],
  future: [],
  lastCommitAt: 0,
  view: 'home',
  selected: 'profile',
  dirty: false,
  readingLabel: 'Reading the file',
  importError: null,
  downloadError: null,
  restoredNote: false,
  source: null,
  previewOpen: false,
  nameError: false,
  setView: (view) => set({ view }),
  select: (selected) => set({ selected }),
  setPreviewOpen: (previewOpen) => set({ previewOpen }),
  setReadingLabel: (readingLabel) => set({ readingLabel }),
  setImportError: (importError) => set({ importError }),
  setDownloadError: (downloadError) => set({ downloadError }),
  requireName: () => set({ nameError: true, selected: 'profile', view: 'editor' }),
  clearNameError: () => set({ nameError: false }),
  replaceResume: (resume, options) =>
    set((state) => ({
      resume: normalizeResume(resume),
      past: [],
      future: [],
      lastCommitAt: 0,
      dirty: options?.dirty ?? true,
      restoredNote: options?.restored ?? false,
      source: options && 'source' in options ? (options.source ?? null) : state.source,
      view: options?.view ?? state.view,
      selected: options?.selected ?? 'profile',
      nameError: false,
      downloadError: null,
      importError: null,
    })),
  commit: (updater) =>
    set((state) => {
      const snapshot = structuredClone(state.resume)
      const next = normalizeResume(updater(snapshot))
      if (JSON.stringify(next) === JSON.stringify(state.resume)) return state
      const now = Date.now()
      const coalesce =
        now - state.lastCommitAt < COALESCE_MS &&
        state.future.length === 0 &&
        state.past.length > 0
      if (coalesce) {
        return { resume: next, lastCommitAt: now, dirty: true, nameError: false }
      }
      return {
        resume: next,
        past: [...state.past, state.resume].slice(-HISTORY_LIMIT),
        future: [],
        lastCommitAt: now,
        dirty: true,
        nameError: false,
      }
    }),
  undo: () =>
    set((state) => {
      const previous = state.past[state.past.length - 1]
      if (!previous) return state
      return {
        resume: previous,
        past: state.past.slice(0, -1),
        future: [state.resume, ...state.future].slice(0, HISTORY_LIMIT),
        lastCommitAt: 0,
        dirty: true,
      }
    }),
  redo: () =>
    set((state) => {
      const next = state.future[0]
      if (!next) return state
      return {
        resume: next,
        past: [...state.past, state.resume].slice(-HISTORY_LIMIT),
        future: state.future.slice(1),
        lastCommitAt: 0,
        dirty: true,
      }
    }),
  resetToHome: () =>
    set({
      resume: emptyResume(),
      past: [],
      future: [],
      lastCommitAt: 0,
      view: 'home',
      selected: 'profile',
      dirty: false,
      readingLabel: 'Reading the file',
      importError: null,
      downloadError: null,
      restoredNote: false,
      source: null,
      previewOpen: false,
      nameError: false,
    }),
}))

export function leaveIfDirty(action: () => void) {
  const { dirty } = useResumeStore.getState()
  if (dirty && !window.confirm('This draft lives in this tab. Leave without downloading?')) return
  action()
}

export function startBlank(template: TemplateId) {
  useResumeStore.getState().replaceResume(emptyResume(template), {
    dirty: false,
    restored: false,
    source: null,
    view: 'editor',
    selected: 'profile',
  })
}
