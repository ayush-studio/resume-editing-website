import { pdf } from '@react-pdf/renderer'
import JSZip from 'jszip'
import { attachPayloadToPdf, embedResumePayload } from '../import/payload.ts'
import { downloadBaseName, type Resume } from '../model/resume.ts'
import { registerResumeFonts } from './fonts.ts'
import { ResumeDocument } from './ResumeDocument.tsx'
import { docxBlob } from './toDocx.ts'

function save(bytes: BlobPart, filename: string, type: string) {
  const blob = new Blob([bytes], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export async function renderPdfBlob(resume: Resume): Promise<Blob> {
  registerResumeFonts()
  return pdf(<ResumeDocument resume={resume} />).toBlob()
}

export async function downloadPdf(resume: Resume) {
  const blob = await renderPdfBlob(resume)
  const bytes = new Uint8Array(await blob.arrayBuffer())
  const withPayload = await attachPayloadToPdf(bytes, resume)
  const copy = new Uint8Array(withPayload.byteLength)
  copy.set(withPayload)
  save(copy, `${downloadBaseName(resume)}.pdf`, 'application/pdf')
}

export async function downloadDocx(resume: Resume) {
  const blob = await docxBlob(resume)
  const zip = await JSZip.loadAsync(await blob.arrayBuffer())
  await embedResumePayload(zip, resume)
  const packed = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
  save(packed, `${downloadBaseName(resume)}.docx`, packed.type)
}
