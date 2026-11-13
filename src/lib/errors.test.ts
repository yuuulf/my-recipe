import { describe, expect, it } from 'vitest'
import { getErrorMessage } from './errors'

describe('getErrorMessage', () => {
  it('uses the message of an Error', () => {
    expect(getErrorMessage(new Error('保存できませんでした。'))).toBe('保存できませんでした。')
  })

  it('uses the message of an error-like object such as a Supabase error', () => {
    expect(getErrorMessage({ message: 'duplicate key', code: '23505' })).toBe('duplicate key')
  })

  it('falls back when there is no usable message', () => {
    expect(getErrorMessage(new Error(''))).toBe('処理に失敗しました。')
    expect(getErrorMessage({ message: 42 })).toBe('処理に失敗しました。')
    expect(getErrorMessage('文字列')).toBe('処理に失敗しました。')
    expect(getErrorMessage(null)).toBe('処理に失敗しました。')
    expect(getErrorMessage(undefined, 'レシピを読み込めませんでした。')).toBe('レシピを読み込めませんでした。')
  })
})
