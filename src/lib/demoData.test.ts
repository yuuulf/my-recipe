import { describe, expect, it } from 'vitest'
import { getDemoRecipe, getDemoRecipes } from './demoData'

const titles = (query?: string) => getDemoRecipes(query).map((recipe) => recipe.title)

describe('getDemoRecipes', () => {
  it('returns every recipe, newest update first, without a keyword', () => {
    expect(titles()).toEqual(['トマトとツナのパスタ', 'ふわとろ親子丼', '豚の生姜焼き'])
    expect(titles('   ')).toEqual(titles())
  })

  it('searches the title, description, memo, ingredients and tags', () => {
    expect(titles('親子丼')).toEqual(['ふわとろ親子丼'])
    expect(titles('ご飯がすすむ')).toEqual(['豚の生姜焼き'])
    expect(titles('粉チーズ')).toEqual(['トマトとツナのパスタ'])
    expect(titles('しょうが')).toEqual(['豚の生姜焼き'])
    expect(titles('平日')).toEqual(['トマトとツナのパスタ'])
    // In the ingredients of two recipes.
    expect(titles('玉ねぎ')).toEqual(['ふわとろ親子丼', '豚の生姜焼き'])
  })

  it('does not search the steps', () => {
    // Only in the steps of トマトとツナのパスタ.
    expect(titles('オリーブオイル')).toEqual([])
  })

  it('ignores letter case and surrounding spaces', () => {
    // 'だし汁 100ml' in ふわとろ親子丼.
    expect(titles('ML')).toEqual(['ふわとろ親子丼'])
    expect(titles('  親子丼  ')).toEqual(['ふわとろ親子丼'])
  })

  it('treats % and _ literally, not as wildcards', () => {
    expect(titles('%')).toEqual([])
    expect(titles('_')).toEqual([])
    expect(titles('玉ねぎ%')).toEqual([])
  })

  it('returns copies, so changing a result does not change the demo data', () => {
    const [first] = getDemoRecipes()
    first.title = '書き換え'
    first.tags.push('追加')
    expect(titles()).not.toContain('書き換え')
    expect(getDemoRecipes()[0].tags).not.toContain('追加')
  })
})

describe('getDemoRecipe', () => {
  it('returns the recipe with the id', () => {
    expect(getDemoRecipe('portfolio-recipe-oyakodon')?.title).toBe('ふわとろ親子丼')
  })

  it('returns null for an unknown id', () => {
    expect(getDemoRecipe('portfolio-recipe-unknown')).toBeNull()
    expect(getDemoRecipe('00000000-0000-4000-8000-0000000000a1')).toBeNull()
  })
})
