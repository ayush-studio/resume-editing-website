import {
  blankCertification,
  blankEducation,
  blankExperience,
  blankProject,
  blankSkillGroup,
  createId,
  emptyProfile,
  emptyResume,
  type Certification,
  type Education,
  type Experience,
  type Profile,
  type Project,
  type Resume,
  type SectionId,
  type SkillGroup,
  type TemplateId,
  sectionIds,
} from '../model/resume.ts'

const headingAliases: Record<SectionId, string[]> = {
  summary: ['summary', 'professional summary', 'profile', 'about', 'about me', 'objective'],
  experience: [
    'experience',
    'work experience',
    'professional experience',
    'employment',
    'work history',
  ],
  education: ['education', 'academic background', 'academics'],
  skills: ['skills', 'technical skills', 'core skills', 'skills and tools'],
  projects: ['projects', 'selected projects', 'personal projects'],
  certifications: ['certifications', 'certificates', 'licenses', 'certification'],
}

const month =
  '(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?'
const dateToken = `(?:${month}\\s+)?(?:19|20)\\d{2}`
const dateRange = new RegExp(
  `${dateToken}\\s*(?:-|–|—|to)\\s*(?:present|current|now|${dateToken})`,
  'i',
)
const loneYear = new RegExp(`^(?:${month}\\s+)?(?:19|20)\\d{2}$`, 'i')
const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
const phonePattern = /(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]\d{4}/

function urlPattern(): RegExp {
  return /(?:https?:\/\/|www\.)\S+|(?:linkedin\.com|github\.com)\/\S+/gi
}

function normalizeHeading(line: string): string {
  return line
    .toLowerCase()
    .replace(/[:|•\-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function matchHeading(line: string): SectionId | null {
  const normalized = normalizeHeading(line)
  if (!normalized || normalized.length > 48) return null
  for (const id of sectionIds) {
    if (headingAliases[id].includes(normalized)) return id
  }
  return null
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
}

export function htmlToLines(html: string): string[] {
  const withBreaks = decodeEntities(html)
    .replace(/<p>\s*<strong>([^<]+)<\/strong>\s*<\/p>/gi, '\n$1\n')
    .replace(/<h[1-6][^>]*>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<[^>]+>/g, '')
  return withBreaks
    .split(/\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

function looksLikeLocation(line: string): boolean {
  if (/^remote$/i.test(line)) return true
  return /^[A-Za-z][A-Za-z .'-]{1,40},\s*[A-Za-z][A-Za-z .'-]{1,24}$/.test(line)
}

function assignRange(text: string): { start: string; end: string; current: boolean } {
  const match = text.match(dateRange)
  const raw = match?.[0] ?? text
  const parts = raw
    .split(/\s*(?:-|–|—|\bto\b)\s*/i)
    .map((part) => part.trim())
    .filter(Boolean)
  const end = parts[1] ?? ''
  const current = /^(present|current|now)$/i.test(end)
  return { start: parts[0] ?? '', end: current ? '' : end, current }
}

function stripBullet(line: string): { bullet: boolean; text: string } {
  const match = line.match(/^([•\-*–]|\d+\.)\s+(.*)$/)
  if (!match) return { bullet: false, text: line.trim() }
  return { bullet: true, text: match[2].trim() }
}

function parsePreamble(lines: string[]): { profile: Profile; remainder: string[] } {
  const profile = emptyProfile()
  const blob = lines.join('\n')
  const email = blob.match(emailPattern)
  if (email) profile.email = email[0]
  const phone = blob.match(phonePattern)
  if (phone) profile.phone = phone[0]

  for (const line of lines) {
    const urls = line.match(urlPattern()) ?? []
    for (const url of urls) {
      if (/linkedin\.com/i.test(url) && !profile.linkedin) profile.linkedin = url
      else if (!profile.website && !/linkedin\.com/i.test(url)) profile.website = url
    }
  }

  const remainder: string[] = []
  for (const line of lines) {
    let rest = line
    if (profile.email) rest = rest.replace(profile.email, ' ')
    if (profile.phone) rest = rest.replace(profile.phone, ' ')
    rest = rest.replace(urlPattern(), ' ')
    rest = rest.replace(/[|•·]+/g, ' ').replace(/\s+/g, ' ').trim()
    rest = rest.replace(/^[,/–—-]+|[,/–—-]+$/g, '').trim()
    if (!rest) continue
    if (!profile.location && looksLikeLocation(rest)) {
      profile.location = rest
      continue
    }
    remainder.push(rest)
  }

  if (remainder.length) profile.fullName = remainder[0]
  if (remainder.length > 1 && !looksLikeLocation(remainder[1])) profile.headline = remainder[1]
  return { profile, remainder: remainder.slice(profile.headline ? 2 : 1) }
}

function assignHeader(entry: Experience, text: string) {
  const parts = text.split(/\s+[|–—]\s+|\s+-\s+|\s+at\s+/i).map((part) => part.trim()).filter(Boolean)
  if (parts.length >= 2) {
    if (!entry.title) entry.title = parts[0]
    if (!entry.company) entry.company = parts.slice(1).join(' ')
    return
  }
  if (!entry.title) entry.title = text
  else if (!entry.company) entry.company = text
  else if (!entry.location) entry.location = text
}

function parseExperience(lines: string[]): Experience[] {
  const entries: Experience[] = []
  let current: Experience | null = null

  const start = (): Experience => {
    const entry = blankExperience()
    entry.bullets = []
    entries.push(entry)
    current = entry
    return entry
  }

  for (const raw of lines) {
    const { bullet, text } = stripBullet(raw)
    if (!text) continue
    if (!current) current = start()
    const entry: Experience = current

    if (bullet) {
      entry.bullets.push(text)
      continue
    }

    if (dateRange.test(text) && text.length < 70) {
      if (entry.start && entry.bullets.length) {
        const next = start()
        const range = assignRange(text)
        next.start = range.start
        next.end = range.end
        next.current = range.current
        continue
      }
      const range = assignRange(text)
      entry.start = range.start
      entry.end = range.end
      entry.current = range.current
      const rest = text.replace(dateRange, '').replace(/[|•,–—-]/g, ' ').replace(/\s+/g, ' ').trim()
      if (rest && !entry.location && /[A-Za-z]/.test(rest)) entry.location = rest
      continue
    }

    if (entry.bullets.length) {
      assignHeader(start(), text)
      continue
    }
    assignHeader(entry, text)
  }

  return entries.filter(
    (entry) => entry.title || entry.company || entry.bullets.length || entry.start,
  )
}

function parseEducation(lines: string[]): Education[] {
  const entries: Education[] = []
  let current: Education | null = null

  const start = (): Education => {
    const created = blankEducation()
    entries.push(created)
    current = created
    return created
  }

  for (const raw of lines) {
    const { text } = stripBullet(raw)
    if (!text) continue
    if ((dateRange.test(text) || loneYear.test(text)) && text.length < 48) {
      if (current?.start && (current.school || current.credential)) current = null
      const entry: Education = current ?? start()
      current = entry
      if (dateRange.test(text)) {
        const range = assignRange(text)
        entry.start = range.start
        entry.end = range.current ? 'Present' : range.end
      } else {
        entry.end = text
      }
      continue
    }

    if (current && current.school && current.credential && (current.start || current.end || current.detail)) {
      if (!current.location && looksLikeLocation(text)) {
        current.location = text
        continue
      }
      if (!current.detail) {
        current.detail = text
        continue
      }
      current = null
    }

    const entry: Education = current ?? start()
    current = entry
    if (!entry.school) entry.school = text
    else if (!entry.credential) entry.credential = text
    else if (!entry.location && looksLikeLocation(text)) entry.location = text
    else if (!entry.detail) entry.detail = text
  }

  return entries.filter((entry) => entry.school || entry.credential)
}

function parseSkills(lines: string[]): SkillGroup[] {
  const groups: SkillGroup[] = []
  for (const raw of lines) {
    const text = stripBullet(raw).text
    if (!text) continue
    const colon = text.indexOf(':')
    if (colon > 0 && colon < 40) {
      groups.push({
        id: createId(),
        label: text.slice(0, colon).trim(),
        items: text
          .slice(colon + 1)
          .split(/[,|•]/)
          .map((item) => item.trim())
          .filter(Boolean),
      })
      continue
    }
    const items = text
      .split(/[,|•]/)
      .map((item) => item.trim())
      .filter(Boolean)
    if (!groups.length) groups.push({ ...blankSkillGroup(), label: 'Skills', items: [] })
    groups[0].items.push(...(items.length ? items : [text]))
  }
  return groups.filter((group) => group.items.length || group.label)
}

function parseProjects(lines: string[]): Project[] {
  const entries: Project[] = []
  let current: Project | null = null

  const start = (): Project => {
    const entry = blankProject()
    entry.bullets = []
    entries.push(entry)
    current = entry
    return entry
  }

  for (const raw of lines) {
    const { bullet, text } = stripBullet(raw)
    if (!text) continue
    const url = text.match(/(?:https?:\/\/|www\.)\S+/i)?.[0]
    if (!current) current = start()
    const entry: Project = current

    if (bullet) {
      entry.bullets.push(text)
      continue
    }
    if (url && text.replace(url, '').trim().length < 8) {
      entry.link = url
      continue
    }
    if (entry.name && (entry.summary || entry.bullets.length)) {
      const next = start()
      next.name = text
      continue
    }
    if (!entry.name) entry.name = text
    else entry.summary = entry.summary ? `${entry.summary} ${text}` : text
  }

  return entries.filter((entry) => entry.name || entry.summary || entry.bullets.length)
}

function parseCertifications(lines: string[]): Certification[] {
  const entries: Certification[] = []
  let current: Certification | null = null

  for (const raw of lines) {
    const text = stripBullet(raw).text
    if (!text) continue
    const dated = (dateRange.test(text) || loneYear.test(text)) && text.length < 40
    if (!current || (current.name && current.issuer && !dated)) {
      current = blankCertification()
      entries.push(current)
    }
    if (dated && current.name) {
      current.date = text.match(loneYear)?.[0] ?? text.match(dateRange)?.[0] ?? text
      const rest = text.replace(current.date, '').replace(/[|•,–—-]/g, ' ').trim()
      if (rest && !current.issuer) current.issuer = rest
      continue
    }
    if (!current.name) current.name = text
    else if (!current.issuer) current.issuer = text
  }

  return entries.filter((entry) => entry.name)
}

type Bucket = { id: SectionId | 'preamble'; lines: string[] }

function bucketLines(lines: string[]): Bucket[] {
  const buckets: Bucket[] = [{ id: 'preamble', lines: [] }]
  for (const line of lines) {
    const plain = line.replace(/^([•\-*–]|\d+\.)\s+/, '')
    const heading = matchHeading(plain)
    if (heading && !/^([•\-*–]|\d+\.)\s+/.test(line)) {
      buckets.push({ id: heading, lines: [] })
      continue
    }
    buckets[buckets.length - 1].lines.push(line)
  }
  return buckets
}

export function mapLines(lines: string[], template: TemplateId = 'editorial'): Resume {
  const resume = emptyResume(template)
  const buckets = bucketLines(lines)
  const preamble = buckets.find((bucket) => bucket.id === 'preamble')?.lines ?? []
  const parsed = parsePreamble(preamble)
  resume.profile = parsed.profile

  const hasSection = buckets.some((bucket) => bucket.id !== 'preamble')
  if (!hasSection && parsed.remainder.length) {
    resume.summary = parsed.remainder.join('\n')
  }

  for (const bucket of buckets) {
    if (bucket.id === 'summary') resume.summary = bucket.lines.join('\n')
    if (bucket.id === 'experience') resume.experience = parseExperience(bucket.lines)
    if (bucket.id === 'education') resume.education = parseEducation(bucket.lines)
    if (bucket.id === 'skills') resume.skills = parseSkills(bucket.lines)
    if (bucket.id === 'projects') resume.projects = parseProjects(bucket.lines)
    if (bucket.id === 'certifications') resume.certifications = parseCertifications(bucket.lines)
  }

  return resume
}

export function mapText(text: string, template: TemplateId = 'editorial'): Resume {
  const lines = text
    .split(/\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
  return mapLines(lines, template)
}
