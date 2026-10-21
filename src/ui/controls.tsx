import type { ButtonHTMLAttributes, ReactNode } from 'react'

export const inputClass =
  'w-full min-h-11 rounded-lg border border-line bg-white px-3 py-2 text-ink outline-none transition focus:border-ink'

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string
  htmlFor?: string
  hint?: string | null
  children: ReactNode
}) {
  return (
    <label className="block" htmlFor={htmlFor}>
      <span className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-muted">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-accent">{hint}</span> : null}
    </label>
  )
}

export function Button({
  tone = 'solid',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'solid' | 'quiet' | 'ghost' }) {
  const tones = {
    solid: 'bg-accent text-white hover:bg-[#9a3412]',
    quiet: 'border border-line bg-panel text-ink hover:border-ink',
    ghost: 'text-ink hover:bg-[#efe8dc]',
  }
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 items-center justify-center rounded-lg px-3 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-40 min-[1180px]:min-h-9 ${tones[tone]} ${className}`}
      {...props}
    />
  )
}

export function Block({
  title,
  actions,
  children,
}: {
  title: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="border-b border-line px-4 py-5 sm:px-5 sm:py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl leading-none sm:text-[1.7rem]">{title}</h2>
        <div className="flex flex-wrap gap-2">{actions}</div>
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  )
}
