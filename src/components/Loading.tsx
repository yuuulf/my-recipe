export function PageLoader({ label = '読み込み中…' }: { label?: string }) {
  return (
    <div className="flex min-h-61.25 flex-col items-center justify-center gap-3.25 text-14 text-text-secondary" role="status" aria-live="polite">
      <span className="size-7 animate-spin rounded-full border-3 border-border border-t-primary" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

export function InlineLoader() {
  return <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-border border-t-primary" role="status" aria-label="読み込み中" />
}
