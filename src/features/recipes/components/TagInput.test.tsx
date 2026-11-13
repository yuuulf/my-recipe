import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { TagInput } from './TagInput'

// TagInput is controlled; keep the tags in state like RecipeForm does.
function Harness({ initial = [] }: { initial?: string[] }) {
  const [tags, setTags] = useState(initial)
  return (
    <>
      <TagInput tags={tags} onChange={setTags} />
      <output data-testid="tags">{tags.join('|')}</output>
    </>
  )
}

const setup = (initial?: string[]) => {
  render(<Harness initial={initial} />)
  return {
    user: userEvent.setup(),
    input: screen.getByPlaceholderText('タグを入力してEnter'),
    tags: () => screen.getByTestId('tags').textContent,
  }
}

describe('TagInput', () => {
  it('adds a tag with Enter, a comma or the + button', async () => {
    const { user, input, tags } = setup()
    await user.type(input, '和食{Enter}')
    await user.type(input, '#お弁当,')
    await user.type(input, '作り置き')
    await user.click(screen.getByRole('button', { name: 'タグを追加' }))
    // A leading # is removed.
    expect(tags()).toBe('和食|お弁当|作り置き')
    expect(input).toHaveValue('')
  })

  it('does not add a tag with the Enter that confirms Japanese conversion', async () => {
    const { user, input, tags } = setup()
    await user.type(input, 'わしょく')
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true })
    // Safari ends composition before keydown and reports keyCode 229 instead.
    fireEvent.keyDown(input, { key: 'Enter', keyCode: 229 })
    expect(tags()).toBe('')
    expect(input).toHaveValue('わしょく')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(tags()).toBe('わしょく')
  })

  it('does not add a tag over 20 characters and keeps the text', async () => {
    const { user, input, tags } = setup()
    await user.type(input, `${'あ'.repeat(21)}{Enter}`)
    expect(tags()).toBe('')
    expect(screen.getByRole('alert')).toHaveTextContent('タグは20文字以内にしてください。')
    expect(input).toHaveValue('あ'.repeat(21))
    // Typing again clears the message.
    await user.type(input, '{Backspace}')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    await user.type(input, '{Enter}')
    expect(tags()).toBe('あ'.repeat(20))
  })

  it('stops at ten tags', async () => {
    const ten = Array.from({ length: 10 }, (_, index) => `タグ${index + 1}`)
    const { user, input, tags } = setup(ten)
    expect(screen.getByRole('button', { name: 'タグを追加' })).toBeDisabled()
    expect(screen.getByText('タグは10個までです')).toBeInTheDocument()
    await user.type(input, '十一{Enter}')
    expect(tags()).toBe(ten.join('|'))
    expect(screen.getByRole('alert')).toHaveTextContent('タグは10個までです。')
  })

  it('ignores duplicates and empty input', async () => {
    const { user, input, tags } = setup(['和食'])
    await user.type(input, '和食{Enter}')
    await user.type(input, '   {Enter}')
    expect(tags()).toBe('和食')
    expect(input).toHaveValue('')
  })

  it('removes a tag', async () => {
    const { user, tags } = setup(['和食', '朝食'])
    await user.click(screen.getByRole('button', { name: '和食を削除' }))
    expect(tags()).toBe('朝食')
  })
})
