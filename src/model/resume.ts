import { z } from 'zod'

export const sectionIds = [
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
] as const

export const templateIds = ['editorial', 'split', 'compact'] as const
export const accentIds = ['ink', 'vermilion', 'cobalt', 'forest'] as const

export type SectionId = (typeof sectionIds)[number]
export type TemplateId = (typeof templateIds)[number]
export type AccentId = (typeof accentIds)[number]
export type Selectable = 'profile' | SectionId

export const sectionLabels: Record<SectionId, string> = {
  summary: 'Summary',
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
}

export const templateLabels: Record<TemplateId, string> = {
  editorial: 'Editorial',
  split: 'Split',
  compact: 'Compact',
}

export const accents: Record<AccentId, { label: string; value: string }> = {
  ink: { label: 'Ink', value: '#1a1814' },
  vermilion: { label: 'Vermilion', value: '#c2410c' },
  cobalt: { label: 'Cobalt', value: '#1d4e89' },
  forest: { label: 'Forest', value: '#1f6b4a' },
}

const profileSchema = z.object({
  fullName: z.string(),
  headline: z.string(),
  email: z.string(),
  phone: z.string(),
  location: z.string(),
  website: z.string(),
  linkedin: z.string(),
})

const experienceSchema = z.object({
  id: z.string(),
  company: z.string(),
  title: z.string(),
  location: z.string(),
  start: z.string(),
  end: z.string(),
  current: z.boolean(),
  bullets: z.array(z.string()),
})

const educationSchema = z.object({
  id: z.string(),
  school: z.string(),
  credential: z.string(),
  location: z.string(),
  start: z.string(),
  end: z.string(),
  detail: z.string(),
})

const skillGroupSchema = z.object({
  id: z.string(),
  label: z.string(),
  items: z.array(z.string()),
})

const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  link: z.string(),
  summary: z.string(),
  bullets: z.array(z.string()),
})

const certificationSchema = z.object({
  id: z.string(),
  name: z.string(),
  issuer: z.string(),
  date: z.string(),
})

export const resumeSchema = z.object({
  profile: profileSchema,
  summary: z.string(),
  experience: z.array(experienceSchema),
  education: z.array(educationSchema),
  skills: z.array(skillGroupSchema),
  projects: z.array(projectSchema),
  certifications: z.array(certificationSchema),
  sectionOrder: z.array(z.enum(sectionIds)),
  appearance: z.object({
    template: z.enum(templateIds),
    accent: z.enum(accentIds),
  }),
})

export type Profile = z.infer<typeof profileSchema>
export type Experience = z.infer<typeof experienceSchema>
export type Education = z.infer<typeof educationSchema>
export type SkillGroup = z.infer<typeof skillGroupSchema>
export type Project = z.infer<typeof projectSchema>
export type Certification = z.infer<typeof certificationSchema>
export type Resume = z.infer<typeof resumeSchema>

export function createId(): string {
  return crypto.randomUUID()
}

export function emptyProfile(): Profile {
  return {
    fullName: '',
    headline: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    linkedin: '',
  }
}

export function emptyResume(template: TemplateId = 'editorial'): Resume {
  return {
    profile: emptyProfile(),
    summary: '',
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    sectionOrder: [...sectionIds],
    appearance: { template, accent: 'ink' },
  }
}

export function blankExperience(): Experience {
  return {
    id: createId(),
    company: '',
    title: '',
    location: '',
    start: '',
    end: '',
    current: false,
    bullets: [''],
  }
}

export function blankEducation(): Education {
  return {
    id: createId(),
    school: '',
    credential: '',
    location: '',
    start: '',
    end: '',
    detail: '',
  }
}

export function blankSkillGroup(): SkillGroup {
  return { id: createId(), label: '', items: [''] }
}

export function blankProject(): Project {
  return { id: createId(), name: '', link: '', summary: '', bullets: [''] }
}

export function blankCertification(): Certification {
  return { id: createId(), name: '', issuer: '', date: '' }
}

export function normalizeResume(resume: Resume): Resume {
  const seen = new Set<SectionId>()
  const sectionOrder: SectionId[] = []
  for (const id of resume.sectionOrder) {
    if (seen.has(id)) continue
    seen.add(id)
    sectionOrder.push(id)
  }
  for (const id of sectionIds) {
    if (!seen.has(id)) sectionOrder.push(id)
  }
  return { ...resume, sectionOrder }
}

export function parseResume(data: unknown): Resume | null {
  const parsed = resumeSchema.safeParse(data)
  if (!parsed.success) return null
  return normalizeResume(parsed.data)
}

export function filledBullets(bullets: string[]): string[] {
  return bullets.map((bullet) => bullet.trim()).filter(Boolean)
}

export function experienceVisible(item: Experience): boolean {
  return Boolean(
    item.company.trim() ||
      item.title.trim() ||
      item.location.trim() ||
      item.start.trim() ||
      item.end.trim() ||
      item.current ||
      filledBullets(item.bullets).length,
  )
}

export function educationVisible(item: Education): boolean {
  return Boolean(
    item.school.trim() ||
      item.credential.trim() ||
      item.location.trim() ||
      item.start.trim() ||
      item.end.trim() ||
      item.detail.trim(),
  )
}

export function skillsVisible(group: SkillGroup): boolean {
  return Boolean(group.label.trim() || group.items.some((item) => item.trim()))
}

export function projectVisible(item: Project): boolean {
  return Boolean(
    item.name.trim() ||
      item.link.trim() ||
      item.summary.trim() ||
      filledBullets(item.bullets).length,
  )
}

export function certificationVisible(item: Certification): boolean {
  return Boolean(item.name.trim() || item.issuer.trim() || item.date.trim())
}

export function dateSpan(start: string, end: string, current = false): string {
  const stop = current ? 'Present' : end.trim()
  if (start.trim() && stop) return `${start.trim()} – ${stop}`
  return start.trim() || stop
}

export function contactParts(profile: Profile): string[] {
  return [profile.email, profile.phone, profile.location, profile.website, profile.linkedin]
    .map((part) => part.trim())
    .filter(Boolean)
}

export function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction
  if (index < 0 || target < 0 || target >= items.length) return items
  const copy = items.slice()
  const [item] = copy.splice(index, 1)
  copy.splice(target, 0, item)
  return copy
}

export function downloadBaseName(resume: Resume): string {
  const base = resume.profile.fullName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return base || 'resume'
}

export type ReviewNote = { id: string; message: string }

export function reviewNotes(resume: Resume): ReviewNote[] {
  const notes: ReviewNote[] = []
  if (!resume.profile.fullName.trim()) {
    notes.push({ id: 'name', message: 'No name was found. Add one before you download.' })
  }
  if (!resume.summary.trim()) {
    notes.push({ id: 'summary', message: 'The summary is empty.' })
  }
  if (!resume.experience.some(experienceVisible)) {
    notes.push({
      id: 'experience',
      message: 'No roles were mapped. Add them if this resume has work history.',
    })
  }
  if (!resume.education.some(educationVisible)) {
    notes.push({ id: 'education', message: 'No education was mapped.' })
  }
  if (!resume.skills.some(skillsVisible)) {
    notes.push({ id: 'skills', message: 'No skills were mapped.' })
  }
  return notes
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function emailHint(email: string): string | null {
  const value = email.trim()
  if (!value || emailPattern.test(value)) return null
  return 'This email looks unusual.'
}
