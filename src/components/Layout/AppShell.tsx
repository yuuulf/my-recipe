import {
  BookOpen,
  CircleUserRound,
  LogOut,
  Plus,
  Settings,
  UsersRound,
} from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useApp } from '../../contexts/app-context'
import { RecipeNoteSwitcher } from '../../features/groups/components/RecipeNoteSwitcher'
import { BrandLockup } from '../BrandLockup'
import { eyebrowClassName, iconButtonClassName } from '../styles'

const navItems = [
  { to: '/recipes', label: 'レシピ一覧', icon: BookOpen },
  { to: '/settings', label: 'レシピノートの設定', icon: UsersRound },
]

const navItemClassName = (isActive: boolean) =>
  `flex min-h-10.5 items-center gap-2.5 rounded-md px-2.75 text-14 font-semibold transition-[background,color] duration-180 ease-[ease] ${
    isActive ? 'bg-primary-soft text-primary' : 'text-text-secondary hover:bg-surface-muted hover:text-text'
  }`

const mobileNavItemClassName = (isActive: boolean) =>
  `flex flex-1 flex-col items-center justify-center gap-0.75 text-12 font-bold ${isActive ? 'text-primary' : 'text-text-muted'}`

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, signOut, isDemoUser } = useApp()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-5 hidden w-55 flex-col border-r border-border bg-surface px-4 pt-6 pb-4.5 md:flex xl:w-58">
        <BrandLockup variant="full" />

        <div className="mt-10.5 mb-6.25">
          <span className={`${eyebrowClassName} mb-1.5 px-1`}>選択中のレシピノート</span>
          <RecipeNoteSwitcher variant="sidebar" />
        </div>

        <nav className="grid gap-1" aria-label="メインメニュー">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => navItemClassName(isActive)}
            >
              <Icon size={18} strokeWidth={2} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <NavLink
          className="mx-1 mt-auto mb-4.5 flex min-h-10.5 items-center justify-center gap-2 rounded-md bg-primary text-14 font-bold text-white transition-[background,transform,translate] duration-180 ease-[ease] hover:-translate-y-px hover:bg-primary-hover"
          to="/recipes/new"
        >
          <Plus size={18} />
          <span>レシピを追加</span>
        </NavLink>

        <div className="border-t border-border pt-4">
          {isDemoUser ? (
            <div className="mb-3 flex items-center gap-1.5 text-12 text-text-muted">
              <span className="size-1.75 rounded-full bg-primary/70 ring-3 ring-primary-soft" />
              <span>デモモード</span>
            </div>
          ) : null}
          <div className="flex min-w-0 items-center gap-2.25">
            <div className="grid size-7.75 flex-none place-items-center rounded-full bg-surface-muted text-text-secondary">
              <CircleUserRound size={18} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <strong className="truncate text-12 text-text">{user?.displayName || 'ユーザー'}</strong>
              <span className="truncate text-11 text-text-muted">{user?.email}</span>
            </div>
            <button
              type="button"
              className={iconButtonClassName({ variant: 'muted' })}
              onClick={() => void handleSignOut()}
              aria-label="ログアウト"
              title="ログアウト"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className="min-h-screen w-full min-w-0 md:ml-55 md:w-[calc(100%-220px)] xl:ml-58 xl:w-[calc(100%-232px)]">
        {/* Settings opens from the bottom menu, so the header shows the open recipe note instead. */}
        <header className="flex items-center justify-between gap-3 border-b border-border bg-surface px-4.5 py-3.25 md:hidden">
          <BrandLockup variant="header" className="flex-none" />
          <RecipeNoteSwitcher variant="header" />
        </header>
        <main className="mx-auto w-[min(1180px,100%)] px-4 pt-6 pb-24.25 sm:px-5 sm:pt-6.75 sm:pb-25 md:px-8 md:pt-9.5 md:pb-17.5 xl:px-12 xl:pt-10.5 xl:pb-19.5">{children}</main>
        <nav className="fixed inset-x-0 bottom-0 z-10 flex min-h-16 justify-around border-t border-border bg-white/97 px-4 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] backdrop-blur-[9px] md:hidden" aria-label="モバイルメニュー">
          <NavLink to="/recipes" className={({ isActive }) => mobileNavItemClassName(isActive)}>
            <BookOpen size={18} />
            <span>レシピ</span>
          </NavLink>
          <NavLink to="/recipes/new" className={({ isActive }) => mobileNavItemClassName(isActive)}>
            {/* Keep the icon inline as before Preflight; the line box sets the gap to the label. */}
            <span className="block [&>svg]:inline [&>svg]:align-baseline"><Plus size={20} /></span>
            <span>追加</span>
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => mobileNavItemClassName(isActive)}>
            <Settings size={18} />
            <span>設定</span>
          </NavLink>
        </nav>
      </div>
    </div>
  )
}
