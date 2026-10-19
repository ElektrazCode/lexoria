/**
 * Integration tests against a REAL, SEEDED Go backend. They are excluded from `npm test`.
 *
 *   cd ../backend_go && go run github.com/magefile/mage seed && go run .     # terminal 1
 *   npm run test:integration                                                  # terminal 2
 *
 * Set API_URL to use a backend that is not on http://localhost:8080.
 * They assume the seed data from backend_go/seeds (12 Greek words, 1 group).
 */
import { screen, waitFor, within } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { renderPage } from '@/test/render'
import GreatHall from '@/pages/GreatHall'
import Lexicon from '@/pages/Lexicon'
import MemoryScrolls from '@/pages/MemoryScrolls'

const API_URL = process.env.API_URL ?? 'http://localhost:8080'

beforeAll(() => {
  // The app uses relative /api URLs (Vite proxies them in dev); in tests send them to the backend directly.
  const realFetch = globalThis.fetch
  vi.stubGlobal('fetch', (path: string, init?: RequestInit) => realFetch(API_URL + path, init))
})

describe('against the seeded Go backend', () => {
  it('Lexicon lists the seeded Greek vocabulary and searches it', async () => {
    const user = renderPage(<Lexicon />)
    expect(await screen.findByRole('table', {}, { timeout: 5000 })).toBeInTheDocument()
    expect(screen.getByText('12 words')).toBeInTheDocument()
    expect(screen.getByText('Γεια σου')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Search words'), 'good')
    expect(screen.getByText('3 of 12 words match')).toBeInTheDocument()
  })

  it('Great Hall shows the seeded totals', async () => {
    renderPage(<GreatHall />)
    const board = screen.getByRole('region', { name: 'The library at a glance' })
    await waitFor(() => expect(within(board).getByText('Words').nextElementSibling).toHaveTextContent('12'), { timeout: 5000 })
    expect(within(board).getByText('Word Groups').nextElementSibling).toHaveTextContent('1')
  })

  it('Memory Scrolls starts with the first seeded word', async () => {
    renderPage(<MemoryScrolls />)
    expect(await screen.findByText('Card 1 of 12', {}, { timeout: 5000 })).toBeInTheDocument()
    expect(screen.getByText('Γεια σου')).toBeInTheDocument()
  })
})
