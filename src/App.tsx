import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { GroupLoadError } from './components/GroupLoadError'
import { PageLoader } from './components/Loading'
import { AppProvider } from './contexts/AppContext'
import { useApp } from './contexts/app-context'
import { isSupabaseConfigured } from './lib/supabase'
import { JoinGroupPage } from './pages/JoinGroupPage'
import { LoginPage } from './pages/LoginPage'
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage'
import { RecipeCreatePage } from './pages/RecipeCreatePage'
import { RecipeDetailPage } from './pages/RecipeDetailPage'
import { RecipeEditPage } from './pages/RecipeEditPage'
import { RecipeListPage } from './pages/RecipeListPage'
import { SettingsPage } from './pages/SettingsPage'
import { SetupPage } from './pages/SetupPage'
import { SupabaseSetupPage } from './pages/SupabaseSetupPage'
import { TermsPage } from './pages/TermsPage'

function RootRedirect() {
  const { user, group, authReady, groupLoading, groupError } = useApp()
  if (!authReady || (user && groupLoading)) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (groupError) return <GroupLoadError />
  return <Navigate to={group ? '/recipes' : '/setup'} replace />
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, authReady } = useApp()
  const location = useLocation()
  if (!authReady) return <PageLoader />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}

function GroupGuard({ children }: { children: React.ReactNode }) {
  const { group, groupLoading, groupError } = useApp()
  if (groupLoading) return <PageLoader />
  // A failed load is not the same as having no recipe note: offer a retry.
  if (groupError) return <GroupLoadError />
  if (!group) return <Navigate to="/setup" replace />
  return children
}

function AppRoutes() {
  const { isDemoUser } = useApp()
  // Without connection settings only the demo works, so every other URL shows
  // how to set up Supabase Local.
  if (!isSupabaseConfigured && !isDemoUser) return <SupabaseSetupPage />

  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/join/:token" element={<JoinGroupPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/setup" element={<AuthGuard><SetupPage /></AuthGuard>} />
      <Route path="/recipes" element={<AuthGuard><GroupGuard><RecipeListPage /></GroupGuard></AuthGuard>} />
      <Route path="/recipes/new" element={<AuthGuard><GroupGuard><RecipeCreatePage /></GroupGuard></AuthGuard>} />
      <Route path="/recipes/:id/edit" element={<AuthGuard><GroupGuard><RecipeEditPage /></GroupGuard></AuthGuard>} />
      <Route path="/recipes/:id" element={<AuthGuard><GroupGuard><RecipeDetailPage /></GroupGuard></AuthGuard>} />
      <Route path="/settings" element={<AuthGuard><GroupGuard><SettingsPage /></GroupGuard></AuthGuard>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  )
}

export default App
