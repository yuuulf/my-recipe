import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { CONTACT_FORM_URL } from '../lib/contact'
import { PrivacyPolicyPage } from './PrivacyPolicyPage'

const renderPage = () => render(
  <MemoryRouter>
    <PrivacyPolicyPage />
  </MemoryRouter>,
)

describe('PrivacyPolicyPage', () => {
  it('links to the contact form in a new tab', () => {
    renderPage()
    const link = screen.getByRole('link', { name: '問い合わせフォーム' })
    expect(link).toHaveAttribute('href', CONTACT_FORM_URL)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('shows no email address or mailto link', () => {
    const { container } = renderPage()
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull()
    expect(container.textContent).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/)
  })

  it('explains how to request deletion through the contact form', () => {
    renderPage()
    expect(screen.getByText(/削除を希望する場合は、下記の問い合わせフォームからご連絡ください/)).toBeInTheDocument()
  })
})
