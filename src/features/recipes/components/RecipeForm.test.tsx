import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import type { RecipeFormValues } from '../../../types/database'
import { RecipeForm } from './RecipeForm'

const filled: RecipeFormValues = {
  title: 'だし巻き卵',
  description: '',
  ingredients: ['卵 3個', ''],
  steps: ['巻く'],
  tags: ['卵'],
  cookingTimeMinutes: 15,
  servings: 2,
  sourceUrl: '',
  memo: '',
}

const setup = (props: { defaultValues?: RecipeFormValues, disableSave?: boolean, onSubmit?: (values: RecipeFormValues) => Promise<void> } = {}) => {
  const onSubmit = vi.fn(props.onSubmit ?? (async () => {}))
  const { container } = render(
    <MemoryRouter>
      <RecipeForm title="レシピを追加" submitLabel="レシピを保存" defaultValues={props.defaultValues} disableSave={props.disableSave} onSubmit={onSubmit} />
    </MemoryRouter>,
  )
  const field = (name: string) => container.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`)!
  // The save button appears at the top and the bottom of the form.
  const saveButtons = () => screen.getAllByRole('button', { name: 'レシピを保存' })
  return { user: userEvent.setup(), onSubmit, field, saveButtons }
}

describe('RecipeForm', () => {
  it('has the page heading for screen readers only', () => {
    setup()
    const heading = screen.getByRole('heading', { level: 1, name: 'レシピを追加' })
    expect(heading).toHaveClass('sr-only')
    expect(screen.queryByText('料理の記録を残す')).not.toBeInTheDocument()
  })

  it('does not save without a title and shows the error', async () => {
    const { user, onSubmit, saveButtons } = setup()
    await user.click(saveButtons()[0])
    expect(await screen.findByText('料理名を入力してください。')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows an error when leaving a field, before saving', async () => {
    const { user, field } = setup()
    await user.click(field('title'))
    await user.tab()
    expect(await screen.findByText('料理名を入力してください。')).toBeInTheDocument()
  })

  it('does not save values over the limits', async () => {
    const { user, onSubmit, field, saveButtons } = setup({ defaultValues: filled })
    await user.clear(field('title'))
    await user.click(field('title'))
    await user.paste('あ'.repeat(101))
    await user.click(saveButtons()[1])
    expect(await screen.findByText('料理名は100文字以内にしてください。')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('saves valid values without empty rows', async () => {
    const { user, onSubmit, saveButtons } = setup({ defaultValues: filled })
    await user.click(saveButtons()[0])
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith({ ...filled, ingredients: ['卵 3個'] })
  })

  it('shows the error when saving fails', async () => {
    const { user, saveButtons } = setup({
      defaultValues: filled,
      onSubmit: async () => { throw new Error('通信に失敗しました。') },
    })
    await user.click(saveButtons()[0])
    expect(await screen.findByRole('alert')).toHaveTextContent('通信に失敗しました。')
  })

  it('cannot save in the demo', async () => {
    const { user, onSubmit, saveButtons } = setup({ defaultValues: filled, disableSave: true })
    for (const button of saveButtons()) expect(button).toBeDisabled()
    expect(screen.getByRole('note')).toHaveTextContent('デモモードではレシピを閲覧・編集できますが、変更は保存できません。')
    await user.click(saveButtons()[0])
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('counts the characters of the description and memo', async () => {
    const { user, field } = setup()
    expect(screen.getByText('0 / 500')).toBeInTheDocument()
    expect(screen.getByText('0 / 2,000')).toBeInTheDocument()
    await user.click(field('description'))
    await user.paste('い'.repeat(501))
    const count = screen.getByText('501 / 500')
    // Red once over the limit.
    expect(count).toHaveClass('text-danger')
  })
})
