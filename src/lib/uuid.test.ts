import { describe, expect, it } from 'vitest'
import { isUuid } from './uuid'

describe('isUuid', () => {
  it('accepts lowercase and uppercase UUIDs', () => {
    expect(isUuid('00000000-0000-4000-8000-000000000101')).toBe(true)
    expect(isUuid('3F2504E0-4F89-41D3-9A0C-0305E82C3301')).toBe(true)
  })

  it('rejects values that are not UUIDs', () => {
    expect(isUuid('')).toBe(false)
    expect(isUuid('abc')).toBe(false)
    // The end of the link was cut off.
    expect(isUuid('00000000-0000-4000-8000-00000000010')).toBe(false)
    expect(isUuid('00000000-0000-4000-8000-0000000001011')).toBe(false)
    expect(isUuid(' 00000000-0000-4000-8000-000000000101')).toBe(false)
    expect(isUuid('{00000000-0000-4000-8000-000000000101}')).toBe(false)
    expect(isUuid('0000000g-0000-4000-8000-000000000101')).toBe(false)
    expect(isUuid('portfolio-recipe-ginger-pork')).toBe(false)
  })
})
