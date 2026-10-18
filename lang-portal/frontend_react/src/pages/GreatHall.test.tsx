import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/client'
import { getLastStudySession, getQuickStats, getStudyProgress } from '@/api/endpoints'
import { renderPage } from '@/test/render'
import GreatHall from './GreatHall'

vi.mock('@/api/endpoints')

const SESSION_TIME = '2026-10-01T10:00:00Z'

function mockDashboard({ session = null as null | { id: number; group_id: number; created_at: string } } = {}) {
  vi.mocked(getQuickStats).mockResolvedValue({ total_words: 12, total_groups: 3 })
  vi.mocked(getStudyProgress).mockResolvedValue({ total_sessions: 7, total_words: 12 })
  vi.mocked(getLastStudySession).mockResolvedValue({ session })
}

const card = (title: string) => screen.getByRole('heading', { name: title }).closest('article') as HTMLElement
/** The <dd> value that belongs to a <dt> label. */
const valueOf = (container: HTMLElement, label: string) => within(container).getByText(label).nextElementSibling

describe('Great Hall', () => {
  it('shows loading placeholders first', () => {
    vi.mocked(getQuickStats).mockReturnValue(new Promise(() => {}))
    vi.mocked(getStudyProgress).mockReturnValue(new Promise(() => {}))
    vi.mocked(getLastStudySession).mockReturnValue(new Promise(() => {}))
    renderPage(<GreatHall />)
    expect(screen.getAllByRole('status')).toHaveLength(3)
  })

  it('renders the real statistics with honest labels', async () => {
    mockDashboard()
    renderPage(<GreatHall />)

    await waitFor(() => expect(valueOf(card('The Library'), 'Words in the Lexicon')).toHaveTextContent('12'))
    expect(valueOf(card('The Library'), 'Word groups')).toHaveTextContent('3')
    await waitFor(() => expect(valueOf(card('Study Sessions'), 'Sessions recorded')).toHaveTextContent('7'))
    // Nothing is recorded about learning, so the page must not claim it
    expect(screen.queryByText(/learned|mastered/i)).not.toBeInTheDocument()
  })

  it('shows a friendly empty state when there is no last session', async () => {
    mockDashboard({ session: null })
    renderPage(<GreatHall />)
    expect(await screen.findByText(/You have not studied yet/)).toBeInTheDocument()
  })

  it('shows the last session date and group when one exists', async () => {
    mockDashboard({ session: { id: 1, group_id: 2, created_at: SESSION_TIME } })
    renderPage(<GreatHall />)

    const last = card('Last Study Session')
    expect(await within(last).findByText('Group #2')).toBeInTheDocument()
    // Same formatting call as the page (user's locale; the test config pins the time zone to UTC)
    const expected = new Date(SESSION_TIME).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })
    expect(valueOf(last, 'When')).toHaveTextContent(expected)
    expect(screen.queryByText(/You have not studied yet/)).not.toBeInTheDocument()
  })

  it('falls back to the raw text for an unparseable date', async () => {
    mockDashboard({ session: { id: 1, group_id: 2, created_at: 'not-a-date' } })
    renderPage(<GreatHall />)
    expect(await within(card('Last Study Session')).findByText('not-a-date')).toBeInTheDocument()
  })

  it('keeps the other cards working when one request fails, and retries only that card', async () => {
    mockDashboard()
    vi.mocked(getQuickStats).mockRejectedValueOnce(new ApiError('Stats unavailable', 500)).mockResolvedValue({ total_words: 12, total_groups: 3 })
    const user = renderPage(<GreatHall />)

    expect(await within(card('The Library')).findByRole('alert')).toHaveTextContent('Stats unavailable')
    expect(await within(card('Study Sessions')).findByText('Sessions recorded')).toBeInTheDocument()
    expect(await within(card('Last Study Session')).findByText(/You have not studied yet/)).toBeInTheDocument()
    expect(screen.getAllByRole('alert')).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Try again: library statistics' }))
    expect(await within(card('The Library')).findByText('Words in the Lexicon')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(getStudyProgress).toHaveBeenCalledTimes(1) // other cards were not reloaded
    expect(getLastStudySession).toHaveBeenCalledTimes(1)
  })

  it('shows an independent error and retry button per failed card', async () => {
    const down = new ApiError('Server down', 500)
    vi.mocked(getQuickStats).mockRejectedValue(down)
    vi.mocked(getStudyProgress).mockRejectedValue(down)
    vi.mocked(getLastStudySession).mockRejectedValue(down)
    renderPage(<GreatHall />)

    await waitFor(() => expect(screen.getAllByRole('alert')).toHaveLength(3))
    for (const subject of ['library statistics', 'study sessions', 'last study session']) {
      expect(screen.getByRole('button', { name: `Try again: ${subject}` })).toBeInTheDocument()
    }
  })

  it('links to the Lexicon and Memory Scrolls, and keeps the Coming Soon section', async () => {
    mockDashboard()
    renderPage(<GreatHall />)

    expect(screen.getByRole('link', { name: 'Open the Memory Scrolls' })).toHaveAttribute('href', '/memory-scrolls')
    expect(screen.getByRole('link', { name: 'Browse the Lexicon' })).toHaveAttribute('href', '/lexicon')
    expect(screen.getByRole('heading', { name: 'Coming Soon' })).toBeInTheDocument()
    expect(screen.getAllByText('Coming soon')).toHaveLength(3)
    await screen.findByText(/You have not studied yet/) // let the data requests settle
  })
})
