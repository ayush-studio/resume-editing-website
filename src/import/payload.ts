import JSZip from 'jszip'
import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFRawStream,
  PDFString,
  decodePDFRawStream,
} from 'pdf-lib'
import { parseResume, type Resume } from '../model/resume.ts'

const payloadFile = 'resume.json'
const itemPath = 'customXml/item1.xml'
const propsPath = 'customXml/itemProps1.xml'
const relsPath = 'customXml/_rels/item1.xml.rels'
const itemId = '{7C3E1A20-5B14-4E0A-9C1D-111111111111}'

function payloadXml(resume: Resume): string {
  const json = JSON.stringify(resume).replace(/]]>/g, ']]]]><![CDATA[>')
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<resumeStudio xmlns="https://resume.studio/schema"><![CDATA[${json}]]></resumeStudio>`
}

const propsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<ds:datastoreItem ds:itemID="${itemId}" xmlns:ds="http://schemas.openxmlformats.org/officeDocument/2006/customXml">
  <ds:schemaRefs>
    <ds:schemaRef ds:uri="https://resume.studio/schema"/>
  </ds:schemaRefs>
</ds:datastoreItem>`

const itemRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/customXmlProps" Target="itemProps1.xml"/>
</Relationships>`

function insertBeforeClose(xml: string, closeTag: string, snippet: string, marker: string): string {
  if (xml.includes(marker)) return xml
  return xml.replace(closeTag, `${snippet}${closeTag}`)
}

export async function embedResumePayload(zip: JSZip, resume: Resume) {
  zip.file(itemPath, payloadXml(resume))
  zip.file(propsPath, propsXml)
  zip.file(relsPath, itemRelsXml)

  const typesFile = zip.file('[Content_Types].xml')
  if (typesFile) {
    const xml = await typesFile.async('string')
    const withItem = insertBeforeClose(
      xml,
      '</Types>',
      '<Override PartName="/customXml/item1.xml" ContentType="application/xml"/>',
      'PartName="/customXml/item1.xml"',
    )
    const withProps = insertBeforeClose(
      withItem,
      '</Types>',
      '<Override PartName="/customXml/itemProps1.xml" ContentType="application/vnd.openxmlformats-officedocument.customXmlProperties+xml"/>',
      'PartName="/customXml/itemProps1.xml"',
    )
    zip.file('[Content_Types].xml', withProps)
  }

  const relsFile = zip.file('word/_rels/document.xml.rels')
  if (relsFile) {
    const xml = await relsFile.async('string')
    zip.file(
      'word/_rels/document.xml.rels',
      insertBeforeClose(
        xml,
        '</Relationships>',
        '<Relationship Id="rIdResumeStudio" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/customXml" Target="../customXml/item1.xml"/>',
        'Target="../customXml/item1.xml"',
      ),
    )
  }
}

function resumeFromXml(xml: string): Resume | null {
  const match = xml.match(/<!\[CDATA\[([\s\S]*?)\]\]>/)
  if (!match) return null
  try {
    return parseResume(JSON.parse(match[1]))
  } catch {
    return null
  }
}

export async function extractResumePayload(zip: JSZip): Promise<Resume | null> {
  const files = zip.file(/customXml\/item\d+\.xml/)
  for (const file of files) {
    const resume = resumeFromXml(await file.async('string'))
    if (resume) return resume
  }
  return null
}

function attachmentName(value: PDFHexString | PDFString | undefined): string {
  if (!value) return ''
  return value.decodeText()
}

export async function attachPayloadToPdf(bytes: Uint8Array, resume: Resume): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(bytes)
  const encoded = new TextEncoder().encode(JSON.stringify(resume))
  await pdfDoc.attach(encoded, payloadFile, {
    mimeType: 'application/json',
    description: 'Resume Studio document',
    creationDate: new Date(),
    modificationDate: new Date(),
  })
  return pdfDoc.save()
}

export async function extractPayloadFromPdf(bytes: Uint8Array): Promise<Resume | null> {
  const pdfDoc = await PDFDocument.load(bytes, { updateMetadata: false })
  const names = pdfDoc.catalog.lookupMaybe(PDFName.of('Names'), PDFDict)
  const embedded = names?.lookupMaybe(PDFName.of('EmbeddedFiles'), PDFDict)
  const list = embedded?.lookupMaybe(PDFName.of('Names'), PDFArray)
  if (!list) return null

  for (let index = 0; index < list.size(); index += 2) {
    const nameObject = list.lookupMaybe(index, PDFString, PDFHexString)
    const name = attachmentName(nameObject)
    if (name !== payloadFile) continue
    const spec = list.lookupMaybe(index + 1, PDFDict)
    const ef = spec?.lookupMaybe(PDFName.of('EF'), PDFDict)
    const stream = ef?.lookup(PDFName.of('F'))
    if (!(stream instanceof PDFRawStream)) continue
    const json = new TextDecoder().decode(decodePDFRawStream(stream).decode())
    try {
      return parseResume(JSON.parse(json))
    } catch {
      return null
    }
  }
  return null
}
