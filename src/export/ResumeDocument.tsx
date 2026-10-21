import { Document, Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { ReactNode } from 'react'
import {
  accents,
  certificationVisible,
  contactParts,
  dateSpan,
  educationVisible,
  experienceVisible,
  filledBullets,
  projectVisible,
  sectionLabels,
  skillsVisible,
  type Resume,
  type SectionId,
} from '../model/resume.ts'

const ink = '#1c1915'
const muted = '#5c564e'

function ordered(ids: SectionId[], order: SectionId[]) {
  return ids
    .filter((id) => order.includes(id))
    .sort((a, b) => order.indexOf(a) - order.indexOf(b))
}

function sectionHasContent(resume: Resume, id: SectionId): boolean {
  if (id === 'summary') return Boolean(resume.summary.trim())
  if (id === 'experience') return resume.experience.some(experienceVisible)
  if (id === 'education') return resume.education.some(educationVisible)
  if (id === 'skills') return resume.skills.some(skillsVisible)
  if (id === 'projects') return resume.projects.some(projectVisible)
  return resume.certifications.some(certificationVisible)
}

function stylesFor(accent: string, compact: boolean) {
  const body = compact ? 9.5 : 10.5
  return StyleSheet.create({
    page: {
      fontFamily: 'Source Serif 4',
      fontSize: body,
      color: ink,
      paddingTop: compact ? 28 : 40,
      paddingBottom: compact ? 28 : 40,
      paddingHorizontal: compact ? 32 : 42,
      lineHeight: 1.35,
    },
    name: {
      fontFamily: 'Newsreader',
      fontSize: compact ? 22 : 28,
      color: accent,
      marginBottom: 2,
    },
    headline: {
      fontSize: compact ? 10 : 11,
      color: muted,
      marginBottom: 4,
    },
    contact: {
      fontSize: compact ? 8.5 : 9,
      color: muted,
      marginBottom: compact ? 10 : 14,
    },
    section: { marginBottom: compact ? 8 : 12 },
    sectionTitle: {
      fontFamily: 'Source Serif 4',
      fontSize: compact ? 9.5 : 10.5,
      fontWeight: 600,
      color: accent,
      textTransform: 'uppercase',
      letterSpacing: 1.1,
    },
    rule: {
      height: 0.7,
      backgroundColor: accent,
      marginTop: 2,
      marginBottom: compact ? 4 : 6,
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
    role: { fontWeight: 600, fontSize: compact ? 10.5 : 11.5 },
    dates: { fontSize: compact ? 8.5 : 9, color: muted },
    meta: { fontSize: compact ? 9 : 10, color: muted, marginBottom: 2 },
    bulletRow: { flexDirection: 'row', gap: 6, marginBottom: 1 },
    mark: { width: 8 },
    bullet: { flex: 1 },
    paragraph: { marginBottom: 2 },
  })
}

function Section({
  title,
  accent,
  compact,
  children,
}: {
  title: string
  accent: string
  compact: boolean
  children: ReactNode
}) {
  const styles = stylesFor(accent, compact)
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.rule} />
      {children}
    </View>
  )
}

function BulletList({
  bullets,
  accent,
  compact,
}: {
  bullets: string[]
  accent: string
  compact: boolean
}) {
  const styles = stylesFor(accent, compact)
  const items = filledBullets(bullets)
  if (!items.length) return null
  return (
    <View>
      {items.map((bullet, index) => (
        <View key={`${bullet}-${index}`} style={styles.bulletRow} wrap={false}>
          <Text style={styles.mark}>•</Text>
          <Text style={styles.bullet}>{bullet}</Text>
        </View>
      ))}
    </View>
  )
}

function SectionBody({ resume, id, accent, compact }: { resume: Resume; id: SectionId; accent: string; compact: boolean }) {
  const styles = stylesFor(accent, compact)
  if (id === 'summary') {
    return (
      <Section title={sectionLabels.summary} accent={accent} compact={compact}>
        <Text>{resume.summary.trim()}</Text>
      </Section>
    )
  }
  if (id === 'experience') {
    const items = resume.experience.filter(experienceVisible)
    return (
      <Section title={sectionLabels.experience} accent={accent} compact={compact}>
        {items.map((item) => (
          <View key={item.id} style={{ marginBottom: compact ? 6 : 8 }}>
            <View style={styles.row}>
              <Text style={styles.role}>{item.title || item.company}</Text>
              <Text style={styles.dates}>{dateSpan(item.start, item.end, item.current)}</Text>
            </View>
            <Text style={styles.meta}>
              {[item.title ? item.company : '', item.location].filter(Boolean).join('  ·  ')}
            </Text>
            <BulletList bullets={item.bullets} accent={accent} compact={compact} />
          </View>
        ))}
      </Section>
    )
  }
  if (id === 'education') {
    const items = resume.education.filter(educationVisible)
    return (
      <Section title={sectionLabels.education} accent={accent} compact={compact}>
        {items.map((item) => (
          <View key={item.id} style={{ marginBottom: compact ? 6 : 8 }}>
            <View style={styles.row}>
              <Text style={styles.role}>{item.credential || item.school}</Text>
              <Text style={styles.dates}>{dateSpan(item.start, item.end)}</Text>
            </View>
            <Text style={styles.meta}>
              {[item.credential ? item.school : '', item.location].filter(Boolean).join('  ·  ')}
            </Text>
            {item.detail.trim() ? <Text style={styles.paragraph}>{item.detail.trim()}</Text> : null}
          </View>
        ))}
      </Section>
    )
  }
  if (id === 'skills') {
    const groups = resume.skills.filter(skillsVisible)
    return (
      <Section title={sectionLabels.skills} accent={accent} compact={compact}>
        {groups.map((group) => (
          <Text key={group.id} style={styles.paragraph}>
            {group.label.trim() ? `${group.label.trim()}: ` : ''}
            {group.items.map((item) => item.trim()).filter(Boolean).join(', ')}
          </Text>
        ))}
      </Section>
    )
  }
  if (id === 'projects') {
    const items = resume.projects.filter(projectVisible)
    return (
      <Section title={sectionLabels.projects} accent={accent} compact={compact}>
        {items.map((item) => (
          <View key={item.id} style={{ marginBottom: compact ? 6 : 8 }}>
            <Text style={styles.role}>{item.name}</Text>
            {item.link.trim() ? (
              <Link src={item.link.startsWith('http') ? item.link : `https://${item.link}`}>
                <Text style={styles.meta}>{item.link}</Text>
              </Link>
            ) : null}
            {item.summary.trim() ? <Text style={styles.paragraph}>{item.summary.trim()}</Text> : null}
            <BulletList bullets={item.bullets} accent={accent} compact={compact} />
          </View>
        ))}
      </Section>
    )
  }
  const items = resume.certifications.filter(certificationVisible)
  return (
    <Section title={sectionLabels.certifications} accent={accent} compact={compact}>
      {items.map((item) => (
        <View key={item.id} style={{ marginBottom: 4 }}>
          <View style={styles.row}>
            <Text style={styles.role}>{item.name}</Text>
            <Text style={styles.dates}>{item.date}</Text>
          </View>
          {item.issuer.trim() ? <Text style={styles.meta}>{item.issuer}</Text> : null}
        </View>
      ))}
    </Section>
  )
}

function Header({ resume, accent, compact }: { resume: Resume; accent: string; compact: boolean }) {
  const styles = stylesFor(accent, compact)
  const contact = contactParts(resume.profile).join('   ·   ')
  return (
    <View>
      <Text style={styles.name}>{resume.profile.fullName || 'Name'}</Text>
      {resume.profile.headline.trim() ? <Text style={styles.headline}>{resume.profile.headline}</Text> : null}
      {contact ? <Text style={styles.contact}>{contact}</Text> : null}
    </View>
  )
}

export function ResumeDocument({ resume }: { resume: Resume }) {
  const accent = accents[resume.appearance.accent].value
  const compact = resume.appearance.template === 'compact'
  const styles = stylesFor(accent, compact)
  const body = ordered(
    resume.sectionOrder.filter((id) => sectionHasContent(resume, id)),
    resume.sectionOrder,
  )

  if (resume.appearance.template === 'split') {
    const rail = ordered(
      (['skills', 'certifications'] as SectionId[]).filter((id) => sectionHasContent(resume, id)),
      resume.sectionOrder,
    )
    const main = ordered(
      (['summary', 'experience', 'education', 'projects'] as SectionId[]).filter((id) =>
        sectionHasContent(resume, id),
      ),
      resume.sectionOrder,
    )
    return (
      <Document title={resume.profile.fullName || 'Resume'}>
        <Page size="A4" style={styles.page}>
          <View style={{ flexDirection: 'row', gap: 18 }}>
            <View style={{ width: 168 }}>
              <Header resume={resume} accent={accent} compact={compact} />
              {rail.map((id) => (
                <SectionBody key={id} resume={resume} id={id} accent={accent} compact={compact} />
              ))}
            </View>
            <View style={{ flex: 1 }}>
              {main.map((id) => (
                <SectionBody key={id} resume={resume} id={id} accent={accent} compact={compact} />
              ))}
            </View>
          </View>
        </Page>
      </Document>
    )
  }

  return (
    <Document title={resume.profile.fullName || 'Resume'}>
      <Page size="A4" style={styles.page}>
        <Header resume={resume} accent={accent} compact={compact} />
        {body.map((id) => (
          <SectionBody key={id} resume={resume} id={id} accent={accent} compact={compact} />
        ))}
      </Page>
    </Document>
  )
}
