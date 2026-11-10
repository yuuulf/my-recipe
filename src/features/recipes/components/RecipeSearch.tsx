import { Search, X } from 'lucide-react'

type RecipeSearchProps = {
  value: string
  onChange: (value: string) => void
  onClear: () => void
}

export function RecipeSearch({ value, onChange, onClear }: RecipeSearchProps) {
  return (
    <label className="flex min-h-11 w-full items-center gap-2.5 rounded-md border border-border bg-surface px-3.25 text-text-muted shadow-sm transition-[border-color,box-shadow] duration-180 ease-[ease] focus-within:border-primary focus-within:shadow-none focus-within:ring-3 focus-within:ring-primary/10">
      <Search size={19} aria-hidden="true" />
      <input
        type="search"
        className="min-w-0 flex-1 bg-transparent px-0.5 text-14 text-text outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="料理名・材料・タグから検索"
        aria-label="レシピを検索"
      />
      {value ? (
        <button type="button" className="grid place-items-center bg-transparent p-0.75 text-text-muted hover:text-primary" onClick={onClear} aria-label="検索をクリア">
          <X size={17} />
        </button>
      ) : null}
    </label>
  )
}
