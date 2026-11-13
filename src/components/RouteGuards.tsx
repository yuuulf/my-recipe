import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useApp } from '../contexts/app-context'
import { GroupLoadError } from './GroupLoadError'
import { PageLoader } from './Loading'

// Route guards: where to send the user while signing in and loading recipe notes.
export function RootRedirect() {
  const { user, group, authReady, groupLoading, groupError } = useApp()
  if (!authReady || (user && groupLoading)) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (groupError) return <GroupLoadError />
  return <Navigate to={group ? '/recipes' : '/setup'} replace />
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, authReady } = useApp()
  const location = useLocation()
  if (!authReady) return <PageLoader />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}

export function GroupGuard({ children }: { children: ReactNode }) {
  const { group, groupLoading, groupError } = useApp()
  if (groupLoading) return <PageLoader />
  // A failed load is not the same as having no recipe note: offer a retry.
  if (groupError) return <GroupLoadError />
  if (!group) return <Navigate to="/setup" replace />
  return children
}
