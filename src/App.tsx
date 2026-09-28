import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { PageLoader } from './components/Loading'
import { AppProvider } from './contexts/AppContext'
import { useApp } from './contexts/app-context'
import { JoinGroupPage } from './pages/JoinGroupPage'
import { LoginPage } from './pages/LoginPage'
import { RecipeCreatePage } from './pages/RecipeCreatePage'
import { RecipeDetailPage } from './pages/RecipeDetailPage'
import { RecipeEditPage } from './pages/RecipeEditPage'
import { RecipeListPage } from './pages/RecipeListPage'
import { SettingsPage } from './pages/SettingsPage'
import { SetupPage } from './pages/SetupPage'

function RootRedirect() {
  const { user, group, authReady, groupLoading } = useApp()
  if (!authReady || (user && groupLoading)) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
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
  const { group, groupLoading } = useApp()
  if (groupLoading) return <PageLoader />
  if (!group) return <Navigate to="/setup" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/join/:token" element={<JoinGroupPage />} />
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
