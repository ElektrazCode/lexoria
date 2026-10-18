import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'

/** Renders a page inside a router and returns a userEvent instance for interacting with it. */
export function renderPage(ui: ReactElement) {
  const user = userEvent.setup()
  render(<MemoryRouter>{ui}</MemoryRouter>)
  return user
}
