import { describe, expect, it } from 'vitest'
import type { Recipe } from '../../../types/database'
import { recipeToFormValues } from './recipes'

const recipe: Recipe = {
  id: '00000000-0000-4000-8000-0000000000a1',
  group_id: '00000000-0000-4000-8000-000000000100',
  title: 'だし巻き卵',
  description: 'ふんわり',
  ingredients: ['卵 3個'],
  steps: ['巻く'],
  tags: ['卵'],
  cooking_time_minutes: 15,
  servings: 2,
  source_url: 'https://example.com/recipes/dashimaki-tamago',
  memo: 'お弁当に',
  created_by: 'user',
  updated_by: 'user',
  created_at: '2026-11-13T00:00:00Z',
  updated_at: '2026-11-13T00:00:00Z',
}

describe('recipeToFormValues', () => {
  it('maps database fields to form values', () => {
    expect(recipeToFormValues(recipe)).toEqual({
      title: 'だし巻き卵',
      description: 'ふんわり',
      ingredients: ['卵 3個'],
      steps: ['巻く'],
      tags: ['卵'],
      cookingTimeMinutes: 15,
      servings: 2,
      sourceUrl: 'https://example.com/recipes/dashimaki-tamago',
      memo: 'お弁当に',
    })
  })

  it('turns empty values into blank inputs', () => {
    const values = recipeToFormValues({
      ...recipe,
      description: null,
      ingredients: [],
      steps: [],
      tags: [],
      cooking_time_minutes: null,
      servings: null,
      source_url: null,
      memo: null,
    })
    expect(values).toEqual({
      title: 'だし巻き卵',
      description: '',
      // One empty row so the editor has an input to type into.
      ingredients: [''],
      steps: [''],
      tags: [],
      cookingTimeMinutes: undefined,
      servings: undefined,
      sourceUrl: '',
      memo: '',
    })
  })
})
