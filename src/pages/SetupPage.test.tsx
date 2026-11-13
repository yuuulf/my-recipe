import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppContext, type AppContextValue } from '../contexts/app-context'
import { appContextValue } from '../test/appContextValue'
import { SetupPage } from './SetupPage'

const renderSetup = (overrides: Partial<AppContextValue>) => {
  const value = appContextValue(overrides)
  render(
    <AppContext.Provider value={value}>
      <MemoryRouter initialEntries={['/setup']}>
        <Routes>
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/login" element={<p>ログイン画面</p>} />
        </Routes>
      </MemoryRouter>
    </AppContext.Provider>,
  )
  return { value, user: userEvent.setup() }
}

describe('SetupPage', () => {
  it('lets a user without any recipe note sign out', async () => {
    const { value, user } = renderSetup({ groups: [], group: null })
    expect(screen.getByRole('heading', { name: 'レシピノートをつくりましょう' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'ログアウト' }))
    expect(value.signOut).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('ログイン画面')).toBeInTheDocument()
  })

  it('also offers signing out when creating another recipe note', () => {
    renderSetup({})
    expect(screen.getByRole('heading', { name: '新しいレシピノートを作る' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ログアウト' })).toBeInTheDocument()
  })
})
