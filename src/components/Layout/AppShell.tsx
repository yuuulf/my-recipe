import {
  BookOpen,
  ChevronDown,
  CircleUserRound,
  LogOut,
  Plus,
  Settings,
  Soup,
  UsersRound,
} from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useApp } from '../../contexts/app-context'

const navItems = [
  { to: '/recipes', label: 'レシピ一覧', icon: BookOpen },
  { to: '/settings', label: 'グループ設定', icon: UsersRound },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const { group, user, signOut, isDemoMode } = useApp()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">
            <Soup size={21} strokeWidth={2.4} />
          </div>
          <div>
            <strong>MY RECIPE</strong>
            <span>私のレシピ帳</span>
          </div>
        </div>

        <div className="group-switcher">
          <span className="eyebrow">CURRENT NOTEBOOK</span>
          <div className="group-switcher-name">
            <span className="group-avatar">{group?.name.slice(0, 1) ?? '？'}</span>
            <span>{group?.name ?? 'グループ未設定'}</span>
            <ChevronDown size={15} aria-hidden="true" />
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="メインメニュー">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} strokeWidth={2} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <NavLink className="sidebar-add" to="/recipes/new">
          <Plus size={18} />
          <span>レシピを追加</span>
        </NavLink>

        <div className="sidebar-footer">
          {isDemoMode ? (
            <div className="demo-note">
              <span className="status-dot" />
              <span>ローカルプレビュー中</span>
            </div>
          ) : null}
          <div className="account-row">
            <div className="account-avatar">
              <CircleUserRound size={18} />
            </div>
            <div className="account-copy">
              <strong>{user?.displayName || 'ユーザー'}</strong>
              <span>{user?.email}</span>
            </div>
            <button
              type="button"
              className="icon-button muted"
              onClick={() => void handleSignOut()}
              aria-label="ログアウト"
              title="ログアウト"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className="main-column">
        <header className="mobile-header">
          <div className="brand-lockup compact">
            <div className="brand-mark" aria-hidden="true">
              <Soup size={19} />
            </div>
            <strong>MY RECIPE</strong>
          </div>
          <NavLink to="/settings" className="icon-button" aria-label="設定">
            <Settings size={19} />
          </NavLink>
        </header>
        <main className="main-content">{children}</main>
        <nav className="mobile-nav" aria-label="モバイルメニュー">
          <NavLink to="/recipes" className={({ isActive }) => isActive ? 'active' : ''}>
            <BookOpen size={18} />
            <span>レシピ</span>
          </NavLink>
          <NavLink to="/recipes/new" className={({ isActive }) => isActive ? 'active add' : 'add'}>
            <span><Plus size={20} /></span>
            <span>追加</span>
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''}>
            <Settings size={18} />
            <span>設定</span>
          </NavLink>
        </nav>
      </div>
    </div>
  )
}
