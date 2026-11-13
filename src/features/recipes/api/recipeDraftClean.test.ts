import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { LIMITS, MAX_TEXT_LENGTH, parseDraft } from '../../../../supabase/functions/recipe-draft/draft.ts'
import { RECIPE_LIMITS } from '../recipeLimits'
import { RECIPE_DRAFT_MAX_LENGTH } from './recipeDraft'

// What the model returns: the draft as a JSON string.
const reply = (draft: Record<string, unknown>) => JSON.stringify({
  title: 'きゅうりの浅漬け',
  description: '',
  ingredients: ['きゅうり 2本'],
  steps: ['塩で揉む'],
  tags: [],
  cookingTimeMinutes: null,
  servings: null,
  sourceUrl: '',
  memo: '',
  ...draft,
})

describe('parseDraft (Edge Function recipe-draft)', () => {
  it('returns a cleaned draft', () => {
    expect(parseDraft(reply({ title: '  きゅうりの浅漬け  ', ingredients: [' きゅうり 2本 ', '', '塩 少々'], cookingTimeMinutes: 10, servings: 2 }))).toEqual({
      title: 'きゅうりの浅漬け',
      description: '',
      ingredients: ['きゅうり 2本', '塩 少々'],
      steps: ['塩で揉む'],
      tags: [],
      cookingTimeMinutes: 10,
      servings: 2,
      sourceUrl: '',
      memo: '',
    })
  })

  it('returns null when the reply is not usable', () => {
    expect(parseDraft(null)).toBeNull()
    expect(parseDraft('レシピではありません')).toBeNull()
    expect(parseDraft('[]')).toBeNull()
    // Nothing useful was read.
    expect(parseDraft(reply({ title: '', ingredients: [], steps: [] }))).toBeNull()
  })

  it('treats missing or wrong-typed fields as empty', () => {
    const draft = parseDraft(JSON.stringify({ title: 'ゆで卵', ingredients: '卵', steps: [1, '茹でる'], tags: null, servings: '2' }))
    expect(draft).toEqual({
      title: 'ゆで卵',
      description: '',
      ingredients: [],
      steps: ['茹でる'],
      tags: [],
      cookingTimeMinutes: null,
      servings: null,
      sourceUrl: '',
      memo: '',
    })
  })

  it('cuts text and rows to the form limits', () => {
    const draft = parseDraft(reply({
      title: 'あ'.repeat(120),
      description: 'い'.repeat(600),
      ingredients: Array.from({ length: 60 }, () => 'う'.repeat(150)),
      steps: ['え'.repeat(600)],
      memo: 'お'.repeat(2500),
    }))
    expect(draft?.title).toHaveLength(LIMITS.title)
    expect(draft?.description).toHaveLength(LIMITS.description)
    expect(draft?.ingredients).toHaveLength(LIMITS.lines)
    expect(draft?.ingredients[0]).toHaveLength(LIMITS.ingredientLine)
    expect(draft?.steps[0]).toHaveLength(LIMITS.stepLine)
    expect(draft?.memo).toHaveLength(LIMITS.memo)
  })

  it('drops numbers out of range instead of clamping them', () => {
    const draft = parseDraft(reply({ cookingTimeMinutes: 5000, servings: 0 }))
    expect(draft?.cookingTimeMinutes).toBeNull()
    expect(draft?.servings).toBeNull()
    expect(parseDraft(reply({ cookingTimeMinutes: 4320, servings: 100 }))).toMatchObject({ cookingTimeMinutes: 4320, servings: 100 })
    expect(parseDraft(reply({ cookingTimeMinutes: 1.5 }))?.cookingTimeMinutes).toBeNull()
  })

  it('cleans tags: removes #, duplicates and long tags, keeps at most ten', () => {
    expect(parseDraft(reply({ tags: ['#漬物', '漬物', '##野菜', 'あ'.repeat(21), ' '] }))?.tags).toEqual(['漬物', '野菜'])
    const many = Array.from({ length: 12 }, (_, index) => `タグ${index + 1}`)
    expect(parseDraft(reply({ tags: many }))?.tags).toEqual(many.slice(0, LIMITS.tags))
  })

  it('keeps only usable URLs, dropping rather than cutting long ones', () => {
    expect(parseDraft(reply({ sourceUrl: ' https://example.com/recipe ' }))?.sourceUrl).toBe('https://example.com/recipe')
    expect(parseDraft(reply({ sourceUrl: 'https://' }))?.sourceUrl).toBe('')
    expect(parseDraft(reply({ sourceUrl: 'example.com' }))?.sourceUrl).toBe('')
    expect(parseDraft(reply({ sourceUrl: `https://example.com/${'a'.repeat(2000)}` }))?.sourceUrl).toBe('')
  })
})

describe('limits shared by the app and the Edge Function', () => {
  it('uses the same field limits as the recipe form', () => {
    expect(LIMITS).toEqual(RECIPE_LIMITS)
  })

  it('uses the same text length limit as the draft panel', () => {
    expect(MAX_TEXT_LENGTH).toBe(RECIPE_DRAFT_MAX_LENGTH)
  })

  it('pins the same package versions in deno.json as package.json', () => {
    const deno = JSON.parse(readFileSync('supabase/functions/recipe-draft/deno.json', 'utf8')) as { imports: Record<string, string> }
    const app = JSON.parse(readFileSync('package.json', 'utf8')) as { dependencies: Record<string, string> }
    for (const name of ['zod', '@supabase/supabase-js']) {
      expect(deno.imports[name]).toBe(`npm:${name}@${app.dependencies[name].replace(/^\^/, '')}`)
    }
  })
})
