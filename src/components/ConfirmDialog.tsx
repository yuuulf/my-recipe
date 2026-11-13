import { useId, type ReactNode } from 'react'
import { Button } from './Button'
import { alertErrorClassName } from './styles'

type ConfirmDialogProps = {
  title: ReactNode
  description: ReactNode
  confirmLabel: string
  // Shown in the danger-colored square above the title.
  icon: ReactNode
  // While true, the confirm button spins and the dialog cannot be closed.
  loading?: boolean
  // Why the action failed, shown inside the dialog.
  error?: string
  onConfirm: () => void
  onCancel: () => void
}

// A centered confirmation for destructive actions such as deleting a recipe or
// leaving a recipe note. Clicking the backdrop cancels, as the cancel button does.
export function ConfirmDialog({ title, description, confirmLabel, icon, loading = false, error, onConfirm, onCancel }: ConfirmDialogProps) {
  const titleId = useId()
  const cancel = () => {
    if (!loading) onCancel()
  }

  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-text/38 p-5 backdrop-blur-[3px]" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) cancel() }}>
      <div className="w-full max-w-97.5 rounded-lg bg-surface p-7 text-center shadow-md" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="mx-auto mb-3.5 grid size-10.5 place-items-center rounded-md bg-danger-soft text-danger">{icon}</div>
        <h2 id={titleId} className="mb-1.75 text-20 font-bold text-text">{title}</h2>
        <p className="text-14 text-text-secondary">{description}</p>
        {error ? <div className={`${alertErrorClassName} text-left`} role="alert">{error}</div> : null}
        <div className="mt-5.75 flex justify-center gap-2">
          <Button variant="ghost" disabled={loading} onClick={cancel}>キャンセル</Button>
          <Button variant="danger" loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  )
}
