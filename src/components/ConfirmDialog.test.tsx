import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmDialog } from './ConfirmDialog'

const setup = (props: { loading?: boolean, error?: string } = {}) => {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()
  render(
    <ConfirmDialog
      title="レシピを削除しますか？"
      description="元に戻せません。"
      confirmLabel="削除する"
      icon={<span>!</span>}
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...props}
    />,
  )
  return { user: userEvent.setup(), onConfirm, onCancel }
}

describe('ConfirmDialog', () => {
  it('shows the title and description as a labelled dialog', () => {
    setup()
    expect(screen.getByRole('dialog', { name: 'レシピを削除しますか？' })).toBeInTheDocument()
    expect(screen.getByText('元に戻せません。')).toBeInTheDocument()
  })

  it('confirms with the confirm button', async () => {
    const { user, onConfirm, onCancel } = setup()
    await user.click(screen.getByRole('button', { name: '削除する' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('cancels with the cancel button or the backdrop, but not a click inside', async () => {
    const { user, onCancel } = setup()
    await user.click(screen.getByRole('button', { name: 'キャンセル' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
    fireEvent.mouseDown(screen.getByRole('dialog'))
    expect(onCancel).toHaveBeenCalledTimes(1)
    fireEvent.mouseDown(screen.getByRole('presentation'))
    expect(onCancel).toHaveBeenCalledTimes(2)
  })

  it('cannot be closed or confirmed again while the action runs', async () => {
    const { user, onConfirm, onCancel } = setup({ loading: true })
    expect(screen.getByRole('button', { name: 'キャンセル' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '削除する' })).toBeDisabled()
    fireEvent.mouseDown(screen.getByRole('presentation'))
    await user.click(screen.getByRole('button', { name: '削除する' }))
    expect(onCancel).not.toHaveBeenCalled()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('shows why the action failed', () => {
    setup({ error: '削除できませんでした。' })
    expect(screen.getByRole('alert')).toHaveTextContent('削除できませんでした。')
  })
})
