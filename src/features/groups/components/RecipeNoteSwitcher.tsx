import { Check, ChevronDown, Plus } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../../../contexts/app-context'

type RecipeNoteSwitcherProps = {
  // sidebar: the "selected recipe note" block on PC. header: the mobile header button.
  variant: 'sidebar' | 'header'
}

const badgeClassName = 'grid size-7 flex-none place-items-center rounded-md bg-primary-soft text-12 font-extrabold text-primary'

const triggerClassNames = {
  sidebar: 'flex w-full items-center gap-2.25 rounded-md px-1 py-1 text-left text-14 font-bold text-text transition-colors duration-180 ease-[ease] hover:bg-surface-muted',
  header: 'flex min-h-8.5 w-full max-w-44 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-13 font-bold text-text',
}

const panelClassNames = {
  sidebar: 'left-0 right-0',
  header: 'right-0 w-64 max-w-[calc(100vw-32px)]',
}

const itemClassName = 'flex min-h-10.5 w-full items-center gap-2 px-3 text-left text-14 text-text hover:bg-surface-muted'

// Shows the open recipe note and lets the user switch to another one or create one.
// In the demo there is a single fixed note, so only its name is shown.
export function RecipeNoteSwitcher({ variant }: RecipeNoteSwitcherProps) {
  const { groups, group, selectGroup, isDemoUser } = useApp()
  const navigate = useNavigate()
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const name = group?.name ?? 'レシピノート未設定'

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const handleSelect = async (groupId: string) => {
    setOpen(false)
    if (groupId === group?.id) return
    await selectGroup(groupId)
    navigate('/recipes')
  }

  if (isDemoUser) {
    return variant === 'sidebar' ? (
      <div className="flex items-center gap-2.25 px-1 py-1 text-14 font-bold text-text">
        <span className={badgeClassName}>{name.slice(0, 1)}</span>
        <span className="truncate">{name}</span>
      </div>
    ) : (
      <span className="max-w-44 truncate text-13 font-bold text-text">{name}</span>
    )
  }

  return (
    // In the header the button may shrink on narrow screens so it never overflows.
    <div ref={rootRef} className={`relative ${variant === 'header' ? 'min-w-0' : ''}`}>
      <button
        type="button"
        className={triggerClassNames[variant]}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`レシピノートを切り替える（いまは${name}）`}
        onClick={() => setOpen((value) => !value)}
      >
        {variant === 'sidebar' ? <span className={badgeClassName}>{name.slice(0, 1)}</span> : null}
        <span className="min-w-0 flex-1 truncate">{name}</span>
        <ChevronDown className={`flex-none text-text-muted transition-transform duration-180 ease-[ease] ${open ? 'rotate-180' : ''}`} size={16} aria-hidden="true" />
      </button>

      {open ? (
        <div id={menuId} role="menu" className={`absolute top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-md border border-border bg-surface py-1 shadow-md ${panelClassNames[variant]}`}>
          {groups.map((item) => {
            const current = item.id === group?.id
            return (
              <button
                type="button"
                role="menuitemradio"
                aria-checked={current}
                key={item.id}
                className={`${itemClassName} ${current ? 'font-bold' : ''}`}
                onClick={() => void handleSelect(item.id)}
              >
                <Check className={`flex-none text-primary ${current ? '' : 'invisible'}`} size={16} aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">{item.name}</span>
              </button>
            )
          })}
          <div className="my-1 border-t border-border" />
          <Link role="menuitem" to="/setup" className={`${itemClassName} font-bold text-primary`} onClick={() => setOpen(false)}>
            <Plus className="flex-none" size={16} aria-hidden="true" />
            <span>新しいレシピノートを作る</span>
          </Link>
        </div>
      ) : null}
    </div>
  )
}
