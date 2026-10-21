import { useEffect, useRef, useState } from 'react'
import { useResumeStore } from '../state/resumeStore.ts'
import { Button } from './controls.tsx'

export function PreviewPane({ onClose }: { onClose?: () => void }) {
  const resume = useResumeStore((state) => state.resume)
  const [blob, setBlob] = useState<Blob | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const [paneWidth, setPaneWidth] = useState(0)
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    const handle = window.setTimeout(() => {
      setPending(true)
      void import('../export/download.tsx')
        .then(({ renderPdfBlob }) => renderPdfBlob(resume))
        .then((next) => {
          if (cancelled) return
          setBlob(next)
          setError(null)
        })
        .catch((reason: unknown) => {
          if (cancelled) return
          setError(reason instanceof Error ? reason.message : 'The preview could not be drawn.')
        })
        .finally(() => {
          if (!cancelled) setPending(false)
        })
    }, 400)
    return () => {
      cancelled = true
      window.clearTimeout(handle)
    }
  }, [resume])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const observer = new ResizeObserver(() => setPaneWidth(host.clientWidth))
    observer.observe(host)
    setPaneWidth(host.clientWidth)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const host = hostRef.current
    if (!host || !blob || paneWidth < 32) return
    let cancelled = false
    const pixelRatio = Math.max(window.devicePixelRatio || 1, 1)
    void (async () => {
      const pdfjs = await import('pdfjs-dist')
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url,
        ).toString()
      }
      const task = pdfjs.getDocument({ data: await blob.arrayBuffer() })
      const doc = await task.promise
      if (cancelled) {
        await doc.cleanup()
        return
      }
      setPageCount(doc.numPages)
      host.replaceChildren()
      const available = Math.max(paneWidth - 8, 160)
      for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
        const page = await doc.getPage(pageNumber)
        const base = page.getViewport({ scale: 1 })
        const fit = available / base.width
        const viewport = page.getViewport({ scale: fit * zoom * pixelRatio })
        const canvas = document.createElement('canvas')
        const cssWidth = viewport.width / pixelRatio
        const cssHeight = viewport.height / pixelRatio
        canvas.width = viewport.width
        canvas.height = viewport.height
        canvas.style.width = `${cssWidth}px`
        canvas.style.height = `${cssHeight}px`
        canvas.className = 'preview-page'
        const context = canvas.getContext('2d')
        if (!context) continue
        await page.render({ canvasContext: context, canvas, viewport }).promise
        if (cancelled) break
        host.appendChild(canvas)
      }
      await doc.cleanup()
    })().catch((reason: unknown) => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : 'The preview could not be drawn.')
    })
    return () => {
      cancelled = true
    }
  }, [blob, zoom, paneWidth])

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#efe8dc]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-3 py-3 sm:px-4">
        <p className="text-sm text-muted">
          {pageCount ? `${pageCount} page${pageCount === 1 ? '' : 's'}` : 'Preview'}
          {pending ? ' · Updating' : ''}
        </p>
        <div className="flex items-center gap-2">
          {[0.8, 1, 1.15].map((value) => (
            <Button key={value} tone={zoom === value ? 'solid' : 'quiet'} onClick={() => setZoom(value)}>
              {Math.round(value * 100)}%
            </Button>
          ))}
          {onClose ? (
            <Button tone="ghost" className="preview-close" onClick={onClose}>
              Close
            </Button>
          ) : null}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3 sm:p-6">
        {error ? <p className="mb-4 text-sm text-accent">{error}</p> : null}
        <div ref={hostRef} className="mx-auto flex w-full max-w-full flex-col items-center gap-6" />
      </div>
    </div>
  )
}
