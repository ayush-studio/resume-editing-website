import { useResumeStore } from '../state/resumeStore.ts'

const steps = ['Reading the file', 'Finding text', 'Mapping sections']

export function Reading() {
  const label = useResumeStore((state) => state.readingLabel)
  const index = Math.max(0, steps.indexOf(label))
  return (
    <div className="grid min-h-svh place-items-center px-4">
      <div className="w-full max-w-md rounded-lg border border-line bg-panel p-5 sm:p-8">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Reading</p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl">Opening the file</h1>
        <ol className="mt-6 grid gap-2">
          {steps.map((step, stepIndex) => (
            <li key={step} className={stepIndex <= index ? 'text-ink' : 'text-muted'}>
              {stepIndex < index ? 'Done' : stepIndex === index ? 'Now' : 'Next'} · {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
