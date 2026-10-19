/**
 * End-to-end through the real API client (only `fetch` is stubbed): the improved
 * "service may be unavailable" message must reach the ErrorNotice on every page,
 * and Try again must recover once the backend is back.
 */
import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import GreatHall from '@/pages/GreatHall'
import Lexicon from '@/pages/Lexicon'
import MemoryScrolls from '@/pages/MemoryScrolls'
import { words } from '@/test/fixtures'
import { renderPage } from '@/test/render'

const UNAVAILABLE = 'The service may be unavailable. Please make sure the backend is running, then try again.'

type Backend = 'down' | 'up' | 'json-error'
let backend: Backend = 'down'

const fetchMock = vi.fn(async (url: string | URL | Request) => {
  if (backend === 'down') return new Response('', { status: 500 }) // what the Vite proxy sends
  if (backend === 'json-error') return new Response(JSON.stringify({ error: 'database is locked' }), { status: 500 })
  const path = String(url)
  if (path === '/api/words') return new Response(JSON.stringify(words))
  if (path.endsWith('/quick-stats')) return new Response(JSON.stringify({ total_words: 4, total_groups: 1 }))
  if (path.endsWith('/study_progress')) return new Response(JSON.stringify({ total_sessions: 0, total_words: 4 }))
  if (path.endsWith('/last_study_session')) return new Response(JSON.stringify({ session: null }))
  return new Response('not found', { status: 404 })
})

beforeEach(() => {
  backend = 'down'
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  fetchMock.mockClear()
  vi.unstubAllGlobals()
})

describe('Lexicon with the backend unavailable', () => {
  it('shows the friendly message, then recovers with Try again', async () => {
    const user = renderPage(<Lexicon />)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(UNAVAILABLE)
    expect(alert).not.toHaveTextContent('status 500')

    backend = 'up'
    await user.click(within(alert).getByRole('button', { name: 'Try again: Lexicon' }))
    expect(await screen.findByRole('table')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('Memory Scrolls with the backend unavailable', () => {
  it('shows the friendly message, then recovers with Try again', async () => {
    const user = renderPage(<MemoryScrolls />)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(UNAVAILABLE)

    backend = 'up'
    await user.click(within(alert).getByRole('button', { name: 'Try again: Memory Scrolls' }))
    expect(await screen.findByText('Card 1 of 4')).toBeInTheDocument()
  })
})

describe('Great Hall with the backend unavailable', () => {
  it('shows the friendly message for every source, and each recovers on its own', async () => {
    const user = renderPage(<GreatHall />)

    await waitFor(() => expect(screen.getAllByRole('alert')).toHaveLength(3))
    for (const alert of screen.getAllByRole('alert')) expect(alert).toHaveTextContent(UNAVAILABLE)

    backend = 'up'
    await user.click(screen.getByRole('button', { name: 'Try again: library statistics' }))
    await waitFor(() => expect(screen.getAllByRole('alert')).toHaveLength(2))
    expect(screen.queryByRole('button', { name: 'Try again: library statistics' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Try again: study sessions' }))
    await user.click(screen.getByRole('button', { name: 'Try again: last study session' }))
    await waitFor(() => expect(screen.queryAllByRole('alert')).toHaveLength(0))
  })
})

describe('a real error message from the Go backend is not replaced by the generic one', () => {
  it.each([
    ['Lexicon', <Lexicon />],
    ['Memory Scrolls', <MemoryScrolls />],
  ])('%s shows the backend message', async (_name, page) => {
    backend = 'json-error'
    renderPage(page)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('database is locked')
    expect(alert).not.toHaveTextContent('may be unavailable')
  })

  it('Great Hall shows the backend message for each failed source', async () => {
    backend = 'json-error'
    renderPage(<GreatHall />)

    await waitFor(() => expect(screen.getAllByRole('alert')).toHaveLength(3))
    for (const alert of screen.getAllByRole('alert')) expect(alert).toHaveTextContent('database is locked')
  })
})
