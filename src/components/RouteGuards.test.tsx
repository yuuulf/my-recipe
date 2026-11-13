import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppContext, type AppContextValue } from '../contexts/app-context'
import { appContextValue } from '../test/appContextValue'
import { GroupGuard } from './RouteGuards'

const renderGuard = (value: AppContextValue) => render(
  <AppContext.Provider value={value}>
    <MemoryRouter initialEntries={['/recipes']}>
      <Routes>
        <Route path="/recipes" element={<GroupGuard><p>レシピ一覧の中身</p></GroupGuard>} />
        <Route path="/setup" element={<p>セットアップ画面</p>} />
      </Routes>
    </MemoryRouter>
  </AppContext.Provider>,
)

describe('GroupGuard', () => {
  it('shows the page when a recipe note is open', () => {
    renderGuard(appContextValue())
    expect(screen.getByText('レシピ一覧の中身')).toBeInTheDocument()
  })

  it('shows the loader while loading', () => {
    renderGuard(appContextValue({ groupLoading: true, group: null }))
    expect(screen.getByRole('status')).toHaveTextContent('読み込み中')
    expect(screen.queryByText('レシピ一覧の中身')).not.toBeInTheDocument()
  })

  it('offers a retry instead of the setup page when loading failed', async () => {
    const value = appContextValue({ groupError: true, group: null, groups: [] })
    renderGuard(value)
    expect(screen.getByRole('alert')).toHaveTextContent('レシピノートを読み込めませんでした')
    expect(screen.queryByText('セットアップ画面')).not.toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: 'もう一度読み込む' }))
    expect(value.refreshGroup).toHaveBeenCalledTimes(1)
  })

  it('also offers the retry when a loaded recipe note failed to reload', () => {
    renderGuard(appContextValue({ groupError: true }))
    expect(screen.getByRole('button', { name: 'もう一度読み込む' })).toBeInTheDocument()
    expect(screen.queryByText('レシピ一覧の中身')).not.toBeInTheDocument()
  })

  it('sends a user without a recipe note to the setup page', () => {
    renderGuard(appContextValue({ group: null, groups: [] }))
    expect(screen.getByText('セットアップ画面')).toBeInTheDocument()
  })
})
