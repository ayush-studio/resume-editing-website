import { describe, expect, it } from 'vitest'
import { mapText } from './mapText.ts'

const fixture = `
Jane Doe
Product Designer
jane@example.com | (555) 010-1234 | Austin, TX
https://jane.example
https://linkedin.com/in/janedoe

Summary
Designer who ships careful interfaces.

Experience
Product Designer — Acme
Jan 2020 - Present
Austin, TX
• Led the redesign
• Shipped the design system

Education
State University
B.A. Design
2014 - 2018
Austin, TX

Skills
Design: Figma, Typography
Research: Interviews

Projects
Folio
https://folio.example
A resume studio for print.
• Built the editor

Certifications
NN/g UX Certification
Nielsen Norman Group
2022
`

describe('mapText', () => {
  const resume = mapText(fixture)

  it('reads the profile from the preamble', () => {
    expect(resume.profile.fullName).toBe('Jane Doe')
    expect(resume.profile.headline).toBe('Product Designer')
    expect(resume.profile.email).toBe('jane@example.com')
    expect(resume.profile.phone).toBe('(555) 010-1234')
    expect(resume.profile.location).toBe('Austin, TX')
    expect(resume.profile.website).toContain('jane.example')
    expect(resume.profile.linkedin).toContain('linkedin.com/in/janedoe')
  })

  it('maps sections, dates, and bullets', () => {
    expect(resume.summary).toContain('ships careful interfaces')
    expect(resume.experience).toHaveLength(1)
    expect(resume.experience[0]?.title).toBe('Product Designer')
    expect(resume.experience[0]?.company).toBe('Acme')
    expect(resume.experience[0]?.current).toBe(true)
    expect(resume.experience[0]?.start).toBe('Jan 2020')
    expect(resume.experience[0]?.location).toBe('Austin, TX')
    expect(resume.experience[0]?.bullets).toEqual(['Led the redesign', 'Shipped the design system'])
    expect(resume.education[0]?.school).toBe('State University')
    expect(resume.education[0]?.credential).toBe('B.A. Design')
    expect(resume.education[0]?.start).toBe('2014')
    expect(resume.education[0]?.end).toBe('2018')
    expect(resume.skills.map((group) => group.label)).toEqual(['Design', 'Research'])
    expect(resume.skills[0]?.items).toEqual(['Figma', 'Typography'])
    expect(resume.projects[0]?.name).toBe('Folio')
    expect(resume.projects[0]?.link).toContain('folio.example')
    expect(resume.projects[0]?.bullets).toEqual(['Built the editor'])
    expect(resume.certifications[0]?.name).toBe('NN/g UX Certification')
    expect(resume.certifications[0]?.issuer).toBe('Nielsen Norman Group')
    expect(resume.certifications[0]?.date).toBe('2022')
  })
})
