import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx'
import JSZip from 'jszip'
import { PDFDocument } from 'pdf-lib'
import { describe, expect, it } from 'vitest'
import { emptyResume } from '../model/resume.ts'
import { readDocxBytes } from './readFile.ts'
import { attachPayloadToPdf, embedResumePayload, extractPayloadFromPdf, extractResumePayload } from './payload.ts'

describe('hidden resume payload', () => {
  it('round-trips through a Word package', async () => {
    const doc = new Document({
      sections: [{ children: [new Paragraph({ children: [new TextRun('Visible Name')] })] }],
    })
    const buffer = await Packer.toBuffer(doc)
    const zip = await JSZip.loadAsync(buffer)
    const resume = emptyResume()
    resume.profile.fullName = 'Payload Name'
    await embedResumePayload(zip, resume)
    const packed = await zip.generateAsync({ type: 'arraybuffer' })
    const extracted = await extractResumePayload(await JSZip.loadAsync(packed))
    expect(extracted?.profile.fullName).toBe('Payload Name')

    const result = await readDocxBytes(packed)
    expect(result.kind).toBe('exact')
    if (result.kind === 'exact') expect(result.resume.profile.fullName).toBe('Payload Name')
  })

  it('maps a foreign Word file when no payload is present', async () => {
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('Visible Name')] }),
            new Paragraph({ children: [new TextRun('Writer')] }),
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Experience')] }),
            new Paragraph({ children: [new TextRun('Editor — Daily')] }),
          ],
        },
      ],
    })
    const buffer = await Packer.toBuffer(doc)
    const result = await readDocxBytes(Uint8Array.from(buffer).buffer as ArrayBuffer)
    expect(result.kind).toBe('mapped')
    if (result.kind === 'mapped') {
      expect(result.resume.profile.fullName).toBe('Visible Name')
      expect(result.resume.experience[0]?.company).toBe('Daily')
    }
  })

  it('round-trips through a PDF attachment', async () => {
    const pdf = await PDFDocument.create()
    pdf.addPage()
    const saved = await pdf.save()
    const resume = emptyResume('split')
    resume.profile.fullName = 'Payload Name'
    resume.appearance.accent = 'cobalt'
    const withPayload = await attachPayloadToPdf(saved, resume)
    const extracted = await extractPayloadFromPdf(withPayload)
    expect(extracted?.profile.fullName).toBe('Payload Name')
    expect(extracted?.appearance.template).toBe('split')
    expect(extracted?.appearance.accent).toBe('cobalt')
  })
})
