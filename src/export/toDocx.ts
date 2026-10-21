import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx'
import {
  accents,
  certificationVisible,
  dateSpan,
  downloadBaseName,
  educationVisible,
  experienceVisible,
  filledBullets,
  projectVisible,
  sectionLabels,
  skillsVisible,
  type AccentId,
  type Resume,
  type SectionId,
} from '../model/resume.ts'

function colorFor(accent: AccentId): string {
  return accents[accent].value.replace('#', '').toUpperCase()
}

function run(text: string, options?: { bold?: boolean; size?: number; color?: string }) {
  return new TextRun({
    text,
    font: 'Calibri',
    size: options?.size ?? 21,
    bold: options?.bold,
    color: options?.color,
  })
}

function heading(text: string, level: 'title' | 'section', color: string) {
  return new Paragraph({
    heading: level === 'title' ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
    spacing: { before: level === 'title' ? 0 : 280, after: 80 },
    children: [run(text, { bold: true, size: level === 'title' ? 36 : 24, color })],
  })
}

function textLine(text: string): Paragraph[] {
  return text.trim() ? [body(text)] : []
}

function body(text: string) {
  return new Paragraph({
    spacing: { after: 60 },
    children: [run(text)],
  })
}

function bullet(text: string) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 40 },
    children: [run(text)],
  })
}

function sectionParagraphs(resume: Resume, id: SectionId, color: string): Paragraph[] {
  if (id === 'summary' && resume.summary.trim()) {
    return [heading(sectionLabels.summary, 'section', color), body(resume.summary.trim())]
  }
  if (id === 'experience') {
    const items = resume.experience.filter(experienceVisible)
    if (!items.length) return []
    return [
      heading(sectionLabels.experience, 'section', color),
      ...items.flatMap((item) => [
        ...textLine([item.title, item.company].filter(Boolean).join(' — ')),
        ...textLine(
          [dateSpan(item.start, item.end, item.current), item.location].filter(Boolean).join(' · '),
        ),
        ...filledBullets(item.bullets).map((line) => bullet(line)),
      ]),
    ]
  }
  if (id === 'education') {
    const items = resume.education.filter(educationVisible)
    if (!items.length) return []
    return [
      heading(sectionLabels.education, 'section', color),
      ...items.flatMap((item) => [
        ...textLine([item.credential, item.school].filter(Boolean).join(', ')),
        ...textLine([dateSpan(item.start, item.end), item.location, item.detail].filter(Boolean).join(' · ')),
      ]),
    ]
  }
  if (id === 'skills') {
    const groups = resume.skills.filter(skillsVisible)
    if (!groups.length) return []
    return [
      heading(sectionLabels.skills, 'section', color),
      ...groups.map((group) =>
        body(
          `${group.label.trim() ? `${group.label.trim()}: ` : ''}${group.items
            .map((item) => item.trim())
            .filter(Boolean)
            .join(', ')}`,
        ),
      ),
    ]
  }
  if (id === 'projects') {
    const items = resume.projects.filter(projectVisible)
    if (!items.length) return []
    return [
      heading(sectionLabels.projects, 'section', color),
      ...items.flatMap((item) => [
        body([item.name, item.link].filter(Boolean).join(' — ')),
        ...(item.summary.trim() ? [body(item.summary.trim())] : []),
        ...filledBullets(item.bullets).map((line) => bullet(line)),
      ]),
    ]
  }
  const items = resume.certifications.filter(certificationVisible)
  if (!items.length) return []
  return [
    heading(sectionLabels.certifications, 'section', color),
    ...items.map((item) => body([item.name, item.issuer, item.date].filter(Boolean).join(' · '))),
  ]
}

export function buildDocx(resume: Resume): Document {
  const color = colorFor(resume.appearance.accent)
  const profile = resume.profile
  const children: Paragraph[] = [
    heading(profile.fullName.trim() || 'Name', 'title', color),
  ]
  if (profile.headline.trim()) children.push(body(profile.headline.trim()))
  const contact = [profile.email, profile.phone, profile.location, profile.website, profile.linkedin]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' · ')
  if (contact) children.push(body(contact))
  for (const id of resume.sectionOrder) {
    children.push(...sectionParagraphs(resume, id, color))
  }
  return new Document({
    title: profile.fullName.trim() || 'Resume',
    sections: [{ children }],
  })
}

export async function docxBlob(resume: Resume): Promise<Blob> {
  return Packer.toBlob(buildDocx(resume))
}

export function docxFileName(resume: Resume): string {
  return `${downloadBaseName(resume)}.docx`
}
