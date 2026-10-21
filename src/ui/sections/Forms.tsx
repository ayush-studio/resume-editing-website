import { useEffect } from 'react'
import {
  blankCertification,
  blankEducation,
  blankExperience,
  blankProject,
  blankSkillGroup,
  emailHint,
  moveItem,
  sectionLabels,
  type Certification,
  type Education,
  type Experience,
  type Project,
  type SectionId,
  type SkillGroup,
} from '../../model/resume.ts'
import { useResumeStore } from '../../state/resumeStore.ts'
import { Block, Button, Field, inputClass } from '../controls.tsx'

function useCommit() {
  return useResumeStore((state) => state.commit)
}

function SectionMove({ id }: { id: SectionId }) {
  const commit = useCommit()
  const order = useResumeStore((state) => state.resume.sectionOrder)
  const index = order.indexOf(id)
  return (
    <>
      <Button
        tone="ghost"
        disabled={index <= 0}
        onClick={() =>
          commit((resume) => ({ ...resume, sectionOrder: moveItem(resume.sectionOrder, index, -1) }))
        }
      >
        Move up
      </Button>
      <Button
        tone="ghost"
        disabled={index === order.length - 1}
        onClick={() =>
          commit((resume) => ({ ...resume, sectionOrder: moveItem(resume.sectionOrder, index, 1) }))
        }
      >
        Move down
      </Button>
    </>
  )
}

export function ProfileForm() {
  const profile = useResumeStore((state) => state.resume.profile)
  const nameError = useResumeStore((state) => state.nameError)
  const commit = useCommit()
  useEffect(() => {
    if (nameError) document.getElementById('full-name')?.focus()
  }, [nameError])

  const set = (key: keyof typeof profile, value: string) =>
    commit((resume) => ({ ...resume, profile: { ...resume.profile, [key]: value } }))

  return (
    <Block title="Profile">
      <Field label="Full name" htmlFor="full-name" hint={nameError ? 'Add a name before downloading.' : null}>
        <input
          id="full-name"
          className={inputClass}
          value={profile.fullName}
          placeholder="Ada Lovelace"
          onChange={(event) => set('fullName', event.target.value)}
        />
      </Field>
      <Field label="Headline" htmlFor="headline">
        <input
          id="headline"
          className={inputClass}
          value={profile.headline}
          placeholder="Product designer"
          onChange={(event) => set('headline', event.target.value)}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" htmlFor="email" hint={emailHint(profile.email)}>
          <input
            id="email"
            className={inputClass}
            value={profile.email}
            placeholder="ada@example.com"
            onChange={(event) => set('email', event.target.value)}
          />
        </Field>
        <Field label="Phone" htmlFor="phone">
          <input
            id="phone"
            className={inputClass}
            value={profile.phone}
            placeholder="(555) 010-1234"
            onChange={(event) => set('phone', event.target.value)}
          />
        </Field>
      </div>
      <Field label="Location" htmlFor="location">
        <input
          id="location"
          className={inputClass}
          value={profile.location}
          placeholder="Austin, TX"
          onChange={(event) => set('location', event.target.value)}
        />
      </Field>
      <Field label="Website" htmlFor="website">
        <input
          id="website"
          className={inputClass}
          value={profile.website}
          placeholder="https://ada.example"
          onChange={(event) => set('website', event.target.value)}
        />
      </Field>
      <Field label="LinkedIn" htmlFor="linkedin">
        <input
          id="linkedin"
          className={inputClass}
          value={profile.linkedin}
          placeholder="linkedin.com/in/ada"
          onChange={(event) => set('linkedin', event.target.value)}
        />
      </Field>
    </Block>
  )
}

export function SummaryForm() {
  const summary = useResumeStore((state) => state.resume.summary)
  const commit = useCommit()
  return (
    <Block title={sectionLabels.summary} actions={<SectionMove id="summary" />}>
      <Field label="Summary" htmlFor="summary">
        <textarea
          id="summary"
          className={`${inputClass} min-h-32 resize-y`}
          value={summary}
          placeholder="Two or three lines on the work you want to be hired for."
          onChange={(event) => commit((resume) => ({ ...resume, summary: event.target.value }))}
        />
      </Field>
    </Block>
  )
}

function BulletEditor({
  bullets,
  onChange,
  label = 'Bullets',
  addLabel = 'Add bullet',
  placeholder = 'What changed because of this work',
}: {
  bullets: string[]
  onChange: (bullets: string[]) => void
  label?: string
  addLabel?: string
  placeholder?: string
}) {
  const rows = bullets.length ? bullets : ['']
  return (
    <div className="grid gap-2">
      <span className="text-[11px] uppercase tracking-[0.14em] text-muted">{label}</span>
      {rows.map((bullet, index) => (
        <div key={index} className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2">
          <input
            className={inputClass}
            value={bullet}
            placeholder={placeholder}
            onChange={(event) => {
              const next = rows.slice()
              next[index] = event.target.value
              onChange(next)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                const next = rows.slice()
                next.splice(index + 1, 0, '')
                onChange(next)
              }
              if (event.key === 'Backspace' && bullet === '' && rows.length > 1) {
                event.preventDefault()
                onChange(rows.filter((_, row) => row !== index))
              }
            }}
          />
          <Button
            tone="ghost"
            disabled={index === 0}
            onClick={() => onChange(moveItem(rows, index, -1))}
          >
            Up
          </Button>
          <Button
            tone="ghost"
            disabled={index === rows.length - 1}
            onClick={() => onChange(moveItem(rows, index, 1))}
          >
            Down
          </Button>
        </div>
      ))}
      <div>
        <Button tone="quiet" onClick={() => onChange([...rows, ''])}>
          {addLabel}
        </Button>
      </div>
    </div>
  )
}

export function ExperienceForm() {
  const experience = useResumeStore((state) => state.resume.experience)
  const commit = useCommit()
  const update = (id: string, patch: Partial<Experience>) =>
    commit((resume) => ({
      ...resume,
      experience: resume.experience.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }))

  return (
    <Block
      title={sectionLabels.experience}
      actions={
        <>
          <SectionMove id="experience" />
          <Button
            tone="quiet"
            onClick={() =>
              commit((resume) => ({ ...resume, experience: [...resume.experience, blankExperience()] }))
            }
          >
            Add a role
          </Button>
        </>
      }
    >
      {experience.length === 0 ? (
        <p className="text-sm text-muted">No roles yet.</p>
      ) : (
        experience.map((item, index) => (
          <article key={item.id} className="grid gap-3 rounded-lg border border-line bg-white p-3">
            <div className="flex flex-wrap gap-2">
              <Button
                tone="ghost"
                disabled={index === 0}
                onClick={() =>
                  commit((resume) => ({ ...resume, experience: moveItem(resume.experience, index, -1) }))
                }
              >
                Move up
              </Button>
              <Button
                tone="ghost"
                disabled={index === experience.length - 1}
                onClick={() =>
                  commit((resume) => ({ ...resume, experience: moveItem(resume.experience, index, 1) }))
                }
              >
                Move down
              </Button>
              <Button
                tone="ghost"
                onClick={() =>
                  commit((resume) => ({
                    ...resume,
                    experience: resume.experience.filter((entry) => entry.id !== item.id),
                  }))
                }
              >
                Remove
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Title">
                <input className={inputClass} value={item.title} onChange={(event) => update(item.id, { title: event.target.value })} />
              </Field>
              <Field label="Company">
                <input className={inputClass} value={item.company} onChange={(event) => update(item.id, { company: event.target.value })} />
              </Field>
              <Field label="Location">
                <input className={inputClass} value={item.location} onChange={(event) => update(item.id, { location: event.target.value })} />
              </Field>
              <Field label="Start">
                <input className={inputClass} value={item.start} placeholder="Jan 2020" onChange={(event) => update(item.id, { start: event.target.value })} />
              </Field>
              <Field label="End">
                <input
                  className={inputClass}
                  value={item.current ? '' : item.end}
                  placeholder="Mar 2024"
                  disabled={item.current}
                  onChange={(event) => update(item.id, { end: event.target.value })}
                />
              </Field>
              <label className="flex items-end gap-2 pb-2 text-sm">
                <input
                  type="checkbox"
                  checked={item.current}
                  onChange={(event) => update(item.id, { current: event.target.checked, end: event.target.checked ? '' : item.end })}
                />
                Current role
              </label>
            </div>
            <BulletEditor bullets={item.bullets} onChange={(bullets) => update(item.id, { bullets })} />
          </article>
        ))
      )}
    </Block>
  )
}

export function EducationForm() {
  const education = useResumeStore((state) => state.resume.education)
  const commit = useCommit()
  const update = (id: string, patch: Partial<Education>) =>
    commit((resume) => ({
      ...resume,
      education: resume.education.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }))
  return (
    <Block
      title={sectionLabels.education}
      actions={
        <>
          <SectionMove id="education" />
          <Button
            tone="quiet"
            onClick={() => commit((resume) => ({ ...resume, education: [...resume.education, blankEducation()] }))}
          >
            Add a school
          </Button>
        </>
      }
    >
      {education.length === 0 ? <p className="text-sm text-muted">No education yet.</p> : null}
      {education.map((item, index) => (
        <article key={item.id} className="grid gap-3 rounded-lg border border-line bg-white p-3">
          <div className="flex flex-wrap gap-2">
            <Button tone="ghost" disabled={index === 0} onClick={() => commit((resume) => ({ ...resume, education: moveItem(resume.education, index, -1) }))}>
              Move up
            </Button>
            <Button tone="ghost" disabled={index === education.length - 1} onClick={() => commit((resume) => ({ ...resume, education: moveItem(resume.education, index, 1) }))}>
              Move down
            </Button>
            <Button tone="ghost" onClick={() => commit((resume) => ({ ...resume, education: resume.education.filter((entry) => entry.id !== item.id) }))}>
              Remove
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="School">
              <input className={inputClass} value={item.school} onChange={(event) => update(item.id, { school: event.target.value })} />
            </Field>
            <Field label="Credential">
              <input className={inputClass} value={item.credential} onChange={(event) => update(item.id, { credential: event.target.value })} />
            </Field>
            <Field label="Location">
              <input className={inputClass} value={item.location} onChange={(event) => update(item.id, { location: event.target.value })} />
            </Field>
            <Field label="Start">
              <input className={inputClass} value={item.start} onChange={(event) => update(item.id, { start: event.target.value })} />
            </Field>
            <Field label="End">
              <input className={inputClass} value={item.end} onChange={(event) => update(item.id, { end: event.target.value })} />
            </Field>
          </div>
          <Field label="Detail">
            <input className={inputClass} value={item.detail} onChange={(event) => update(item.id, { detail: event.target.value })} />
          </Field>
        </article>
      ))}
    </Block>
  )
}

export function SkillsForm() {
  const skills = useResumeStore((state) => state.resume.skills)
  const commit = useCommit()
  const update = (id: string, patch: Partial<SkillGroup>) =>
    commit((resume) => ({
      ...resume,
      skills: resume.skills.map((group) => (group.id === id ? { ...group, ...patch } : group)),
    }))
  return (
    <Block
      title={sectionLabels.skills}
      actions={
        <>
          <SectionMove id="skills" />
          <Button tone="quiet" onClick={() => commit((resume) => ({ ...resume, skills: [...resume.skills, blankSkillGroup()] }))}>
            Add a group
          </Button>
        </>
      }
    >
      {skills.length === 0 ? <p className="text-sm text-muted">No skills yet.</p> : null}
      {skills.map((group, index) => (
        <article key={group.id} className="grid gap-3 rounded-lg border border-line bg-white p-3">
          <div className="flex flex-wrap gap-2">
            <Button tone="ghost" disabled={index === 0} onClick={() => commit((resume) => ({ ...resume, skills: moveItem(resume.skills, index, -1) }))}>
              Move up
            </Button>
            <Button tone="ghost" disabled={index === skills.length - 1} onClick={() => commit((resume) => ({ ...resume, skills: moveItem(resume.skills, index, 1) }))}>
              Move down
            </Button>
            <Button tone="ghost" onClick={() => commit((resume) => ({ ...resume, skills: resume.skills.filter((entry) => entry.id !== group.id) }))}>
              Remove
            </Button>
          </div>
          <Field label="Group">
            <input className={inputClass} value={group.label} placeholder="Design" onChange={(event) => update(group.id, { label: event.target.value })} />
          </Field>
          <BulletEditor
            bullets={group.items}
            onChange={(items) => update(group.id, { items })}
            label="Skills"
            addLabel="Add a skill"
            placeholder="Figma"
          />
        </article>
      ))}
    </Block>
  )
}

export function ProjectsForm() {
  const projects = useResumeStore((state) => state.resume.projects)
  const commit = useCommit()
  const update = (id: string, patch: Partial<Project>) =>
    commit((resume) => ({
      ...resume,
      projects: resume.projects.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }))
  return (
    <Block
      title={sectionLabels.projects}
      actions={
        <>
          <SectionMove id="projects" />
          <Button tone="quiet" onClick={() => commit((resume) => ({ ...resume, projects: [...resume.projects, blankProject()] }))}>
            Add a project
          </Button>
        </>
      }
    >
      {projects.length === 0 ? <p className="text-sm text-muted">No projects yet.</p> : null}
      {projects.map((item, index) => (
        <article key={item.id} className="grid gap-3 rounded-lg border border-line bg-white p-3">
          <div className="flex flex-wrap gap-2">
            <Button tone="ghost" disabled={index === 0} onClick={() => commit((resume) => ({ ...resume, projects: moveItem(resume.projects, index, -1) }))}>
              Move up
            </Button>
            <Button tone="ghost" disabled={index === projects.length - 1} onClick={() => commit((resume) => ({ ...resume, projects: moveItem(resume.projects, index, 1) }))}>
              Move down
            </Button>
            <Button tone="ghost" onClick={() => commit((resume) => ({ ...resume, projects: resume.projects.filter((entry) => entry.id !== item.id) }))}>
              Remove
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name">
              <input className={inputClass} value={item.name} onChange={(event) => update(item.id, { name: event.target.value })} />
            </Field>
            <Field label="Link">
              <input className={inputClass} value={item.link} onChange={(event) => update(item.id, { link: event.target.value })} />
            </Field>
          </div>
          <Field label="Summary">
            <textarea className={`${inputClass} min-h-20 resize-y`} value={item.summary} onChange={(event) => update(item.id, { summary: event.target.value })} />
          </Field>
          <BulletEditor bullets={item.bullets} onChange={(bullets) => update(item.id, { bullets })} />
        </article>
      ))}
    </Block>
  )
}

export function CertificationsForm() {
  const certifications = useResumeStore((state) => state.resume.certifications)
  const commit = useCommit()
  const update = (id: string, patch: Partial<Certification>) =>
    commit((resume) => ({
      ...resume,
      certifications: resume.certifications.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }))
  return (
    <Block
      title={sectionLabels.certifications}
      actions={
        <>
          <SectionMove id="certifications" />
          <Button
            tone="quiet"
            onClick={() =>
              commit((resume) => ({ ...resume, certifications: [...resume.certifications, blankCertification()] }))
            }
          >
            Add a certificate
          </Button>
        </>
      }
    >
      {certifications.length === 0 ? <p className="text-sm text-muted">No certificates yet.</p> : null}
      {certifications.map((item, index) => (
        <article key={item.id} className="grid gap-3 rounded-lg border border-line bg-white p-3">
          <div className="flex flex-wrap gap-2">
            <Button tone="ghost" disabled={index === 0} onClick={() => commit((resume) => ({ ...resume, certifications: moveItem(resume.certifications, index, -1) }))}>
              Move up
            </Button>
            <Button tone="ghost" disabled={index === certifications.length - 1} onClick={() => commit((resume) => ({ ...resume, certifications: moveItem(resume.certifications, index, 1) }))}>
              Move down
            </Button>
            <Button tone="ghost" onClick={() => commit((resume) => ({ ...resume, certifications: resume.certifications.filter((entry) => entry.id !== item.id) }))}>
              Remove
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Name">
              <input className={inputClass} value={item.name} onChange={(event) => update(item.id, { name: event.target.value })} />
            </Field>
            <Field label="Issuer">
              <input className={inputClass} value={item.issuer} onChange={(event) => update(item.id, { issuer: event.target.value })} />
            </Field>
            <Field label="Date">
              <input className={inputClass} value={item.date} onChange={(event) => update(item.id, { date: event.target.value })} />
            </Field>
          </div>
        </article>
      ))}
    </Block>
  )
}

export function SectionForm({ id }: { id: 'profile' | SectionId }) {
  if (id === 'profile') return <ProfileForm />
  if (id === 'summary') return <SummaryForm />
  if (id === 'experience') return <ExperienceForm />
  if (id === 'education') return <EducationForm />
  if (id === 'skills') return <SkillsForm />
  if (id === 'projects') return <ProjectsForm />
  return <CertificationsForm />
}

export function AllSections() {
  return (
    <>
      <ProfileForm />
      <SummaryForm />
      <ExperienceForm />
      <EducationForm />
      <SkillsForm />
      <ProjectsForm />
      <CertificationsForm />
    </>
  )
}
