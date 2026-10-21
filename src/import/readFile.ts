import JSZip from 'jszip'
import mammoth from 'mammoth'
import {
  type Resume,
  type TemplateId,
} from '../model/resume.ts'
import { htmlToLines, mapLines, mapText } from './mapText.ts'
import { extractPayloadFromPdf, extractResumePayload } from './payload.ts'

import { fileKind } from './fileKind.ts'

export type ImportResult =
  | { kind: 'exact'; resume: Resume; text: string }
  | { kind: 'mapped'; resume: Resume; text: string }
  | { kind: 'no-text'; text: string }
  | { kind: 'unsupported'; message: string }

export { fileKind } from './fileKind.ts'

type Step = (label: string) => void

function mammothInput(buffer: ArrayBuffer): { buffer: Buffer; arrayBuffer: ArrayBuffer } | { arrayBuffer: ArrayBuffer } {
  const copy = buffer.slice(0)
  if (typeof window === 'undefined' && typeof Buffer !== 'undefined') {
    return { buffer: Buffer.from(copy), arrayBuffer: copy }
  }
  return { arrayBuffer: copy }
}

export async function readDocxBytes(buffer: ArrayBuffer, onStep: Step = () => {}): Promise<ImportResult> {
  onStep('Reading the file')
  const zip = await JSZip.loadAsync(buffer.slice(0))
  const embedded = await extractResumePayload(zip)
  onStep('Finding text')
  let lines: string[] = []
  try {
    const html = await mammoth.convertToHtml(mammothInput(buffer))
    lines = htmlToLines(html.value)
  } catch (error) {
    if (!embedded) throw error
  }
  const text = lines.join('\n')
  onStep('Mapping sections')
  if (embedded) return { kind: 'exact', resume: embedded, text }
  if (!text.trim()) return { kind: 'no-text', text: '' }
  return { kind: 'mapped', resume: mapLines(lines), text }
}

type Glyph = { str: string; transform: number[]; width?: number }

function isGlyph(item: unknown): item is Glyph {
  if (!item || typeof item !== 'object') return false
  return 'str' in item && 'transform' in item
}

function linesFromItems(items: unknown[]): string[] {
  const rows: { y: number; parts: { x: number; end: number; str: string }[] }[] = []
  for (const item of items) {
    if (!isGlyph(item) || !item.str.trim()) continue
    const x = item.transform[4] ?? 0
    const y = item.transform[5] ?? 0
    const width = item.width ?? Math.max(item.str.length * 4, 4)
    let row = rows.find((entry) => Math.abs(entry.y - y) < 2)
    if (!row) {
      row = { y, parts: [] }
      rows.push(row)
    }
    row.parts.push({ x, end: x + width, str: item.str })
  }
  rows.sort((a, b) => b.y - a.y)
  return rows
    .map((row) => {
      const parts = row.parts.sort((a, b) => a.x - b.x)
      let line = ''
      let end = 0
      for (const part of parts) {
        if (line && part.x - end > 1.5 && !line.endsWith(' ') && !part.str.startsWith(' ')) {
          line += ' '
        }
        line += part.str
        end = Math.max(end, part.end)
      }
      return line.replace(/\s+/g, ' ').trim()
    })
    .filter(Boolean)
}

async function pdfLines(bytes: Uint8Array): Promise<string[]> {
  const pdfjs = await import('pdfjs-dist')
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url,
    ).toString()
  }
  const task = pdfjs.getDocument({ data: bytes })
  const doc = await task.promise
  const lines: string[] = []
  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber)
    const content = await page.getTextContent()
    lines.push(...linesFromItems(content.items))
  }
  await doc.cleanup()
  return lines
}

export async function readPdfBytes(buffer: ArrayBuffer, onStep: Step = () => {}): Promise<ImportResult> {
  onStep('Reading the file')
  const bytes = new Uint8Array(buffer)
  let embedded: Resume | null = null
  try {
    embedded = await extractPayloadFromPdf(bytes.slice())
  } catch {
    embedded = null
  }
  onStep('Finding text')
  let lines: string[] = []
  try {
    lines = await pdfLines(bytes.slice())
  } catch (error) {
    if (!embedded) {
      const message = error instanceof Error ? error.message : 'This PDF could not be read.'
      return { kind: 'unsupported', message }
    }
  }
  const text = lines.join('\n')
  onStep('Mapping sections')
  if (embedded) return { kind: 'exact', resume: embedded, text }
  if (!text.trim()) return { kind: 'no-text', text: '' }
  return { kind: 'mapped', resume: mapLines(lines), text }
}

export async function readResumeFile(file: File, onStep: Step): Promise<ImportResult> {
  const kind = fileKind(file)
  if (!kind) {
    return {
      kind: 'unsupported',
      message: file.name.toLowerCase().endsWith('.doc')
        ? 'Older .doc files need to be saved as .docx first.'
        : 'Use a PDF or Word (.docx) file.',
    }
  }
  const buffer = await file.arrayBuffer()
  if (kind === 'docx') return readDocxBytes(buffer, onStep)
  return readPdfBytes(buffer, onStep)
}

export function resumeFromPaste(text: string, template: TemplateId = 'editorial'): ImportResult {
  if (!text.trim()) return { kind: 'no-text', text: '' }
  return { kind: 'mapped', resume: mapText(text, template), text }
}
