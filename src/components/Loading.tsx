export function PageLoader({ label = '読み込み中…' }: { label?: string }) {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <span className="loader-orbit" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

export function InlineLoader() {
  return <span className="inline-loader" role="status" aria-label="読み込み中" />
}
