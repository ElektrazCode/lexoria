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

const scoreboard = () => screen.getByRole('region', { name: 'The library at a glance' })
/** The <dd> value that belongs to a <dt> label. */
const valueOf = (label: string) => within(scoreboard()).getByText(label).nextElementSibling

describe('Great Hall title block', () => {
  it('has the heading, welcome text and the scoreboard', async () => {
    mockDashboard()
    renderPage(<GreatHall />)

    expect(screen.getByRole('heading', { level: 1, name: 'The Great Hall' })).toBeInTheDocument()
    expect(
      screen.getByText('Welcome, scholar. Choose an activity to continue your journey in the realm of Greek.'),
    ).toBeInTheDocument()
    expect(scoreboard()).toBeInTheDocument()
    await screen.findByText(/You have not studied yet/) // let the data requests settle
  })

  it('keeps the heading focusable by script only (Layout moves focus to it)', async () => {
    mockDashboard()
    renderPage(<GreatHall />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveAttribute('tabindex', '-1')
    await screen.findByText(/You have not studied yet/)
  })
})

describe('Scoreboard', () => {
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

    await waitFor(() => expect(valueOf('Words')).toHaveTextContent('12'))
    expect(valueOf('Word Groups')).toHaveTextContent('3')
    expect(valueOf('Sessions')).toHaveTextContent('7')
    // Nothing is recorded about learning or streaks, so the page must not claim it
    expect(screen.queryByText(/learned|mastered|streak/i)).not.toBeInTheDocument()
  })

  it('shows a friendly empty state when there is no last session', async () => {
    mockDashboard({ session: null })
    renderPage(<GreatHall />)
    expect(await screen.findByText(/You have not studied yet/)).toBeInTheDocument()
  })

  it('shows a compact last-session date and group, with the full date for assistive technology', async () => {
    mockDashboard({ session: { id: 1, group_id: 2, created_at: SESSION_TIME } })
    renderPage(<GreatHall />)

    // Same formatting calls as the page (user's locale; the test config pins the time zone to UTC)
    const short = new Date(SESSION_TIME).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    const full = new Date(SESSION_TIME).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })
    await waitFor(() => expect(valueOf('Last Session')).toHaveTextContent(`${short} · Group #2`))
    expect(valueOf('Last Session')).toHaveTextContent(`${full}, Group #2`)
    expect(screen.queryByText(/You have not studied yet/)).not.toBeInTheDocument()
  })

  it('falls back to the raw text for an unparseable date', async () => {
    mockDashboard({ session: { id: 1, group_id: 2, created_at: 'not-a-date' } })
    renderPage(<GreatHall />)
    await waitFor(() => expect(valueOf('Last Session')).toHaveTextContent('not-a-date · Group #2'))
  })

  it('keeps the other statistics working when one request fails, and retries only that source', async () => {
    mockDashboard()
    vi.mocked(getQuickStats)
      .mockRejectedValueOnce(new ApiError('Stats unavailable', 500))
      .mockResolvedValue({ total_words: 12, total_groups: 3 })
    const user = renderPage(<GreatHall />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Stats unavailable')
    expect(valueOf('Words')).toHaveTextContent('Unavailable')
    expect(valueOf('Word Groups')).toHaveTextContent('Unavailable')
    await waitFor(() => expect(valueOf('Sessions')).toHaveTextContent('7'))
    expect(await screen.findByText(/You have not studied yet/)).toBeInTheDocument()
    expect(screen.getAllByRole('alert')).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Try again: library statistics' }))
    await waitFor(() => expect(valueOf('Words')).toHaveTextContent('12'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(getStudyProgress).toHaveBeenCalledTimes(1) // other sources were not reloaded
    expect(getLastStudySession).toHaveBeenCalledTimes(1)
  })

  it('shows a long error message in full, outside the plaque artwork', async () => {
    mockDashboard()
    const long = 'The service may be unavailable. '.repeat(8).trim()
    vi.mocked(getQuickStats).mockRejectedValue(new ApiError(long, 500))
    renderPage(<GreatHall />)
    expect(await screen.findByRole('alert')).toHaveTextContent(long)
    expect(scoreboard().querySelector('dl')).not.toContainElement(screen.getByRole('alert'))
  })

  it('shows an independent error and retry button per failed source', async () => {
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
})

describe('Activity portals', () => {
  // The page is rendered without the Layout here, so there is no navigation to confuse the queries
  const portals = () => screen

  it('links the Lexicon and Memory Scrolls cards to their existing routes, named once', async () => {
    mockDashboard()
    renderPage(<GreatHall />)

    const lexicon = portals().getByRole('link', { name: 'The Lexicon' })
    expect(lexicon).toHaveAttribute('href', '/lexicon')
    expect(lexicon).toHaveAccessibleDescription('Explore words and their meanings.')
    const scrolls = portals().getByRole('link', { name: 'Memory Scrolls' })
    expect(scrolls).toHaveAttribute('href', '/memory-scrolls')
    expect(scrolls).toHaveAccessibleDescription('Practise writing and recall words.')
    await screen.findByText(/You have not studied yet/) // let the data requests settle
  })

  it('shows Trial of Wits as Coming Soon, and not as a link', async () => {
    mockDashboard()
    renderPage(<GreatHall />)

    expect(portals().getByText(/Trial of Wits\. Coming soon\./)).toBeInTheDocument()
    expect(portals().queryByRole('link', { name: /Trial of Wits/ })).not.toBeInTheDocument()
    expect(portals().getAllByRole('link')).toHaveLength(2) // Lexicon and Memory Scrolls only
    await screen.findByText(/You have not studied yet/)
  })

  it('uses the card artwork as decorative images, so its printed text is not announced twice', async () => {
    mockDashboard()
    renderPage(<GreatHall />)
    expect(portals().queryAllByRole('img')).toHaveLength(0) // alt="" images have no img role
    const images = document.querySelectorAll('ul img')
    expect(images).toHaveLength(3)
    for (const image of images) expect(image).toHaveAttribute('alt', '')
    await screen.findByText(/You have not studied yet/)
  })

  it('no longer shows the old dashboard', async () => {
    mockDashboard()
    renderPage(<GreatHall />)

    expect(screen.queryByRole('heading', { name: 'Coming Soon' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Open the Memory Scrolls' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Browse the Lexicon' })).not.toBeInTheDocument()
    await screen.findByText(/You have not studied yet/)
  })
})
