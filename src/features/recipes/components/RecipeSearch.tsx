import { Search, X } from 'lucide-react'

type RecipeSearchProps = {
  value: string
  onChange: (value: string) => void
  onClear: () => void
}

export function RecipeSearch({ value, onChange, onClear }: RecipeSearchProps) {
  return (
    <label className="search-field">
      <Search size={19} aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="料理名・材料・タグから検索"
        aria-label="レシピを検索"
      />
      {value ? (
        <button type="button" onClick={onClear} aria-label="検索をクリア">
          <X size={17} />
        </button>
      ) : null}
    </label>
  )
}
