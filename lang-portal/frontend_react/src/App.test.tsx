import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getGroups, getLastStudySession, getQuickStats, getStudyProgress, getWords } from '@/api/endpoints'
import { words } from '@/test/fixtures'
import { AppRoutes } from './App'

vi.mock('@/api/endpoints')

beforeEach(() => {
  vi.mocked(getWords).mockResolvedValue(words)
  vi.mocked(getGroups).mockResolvedValue([])
  vi.mocked(getQuickStats).mockResolvedValue({ total_words: 4, total_groups: 1 })
  vi.mocked(getStudyProgress).mockResolvedValue({ total_sessions: 0, total_words: 4 })
  vi.mocked(getLastStudySession).mockResolvedValue({ session: null })
})

/** Test-only controls for navigation the app itself cannot trigger: an unknown URL, and "back". */
function TestControls() {
  const navigate = useNavigate()
  return (
    <>
      <button onClick={() => navigate('/nope')}>test: go to unknown page</button>
      <button onClick={() => navigate(-1)}>test: go back</button>
    </>
  )
}

async function renderApp(path = '/') {
  const user = userEvent.setup()
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
      <TestControls />
    </MemoryRouter>,
  )
  await act(async () => {}) // let the mocked data requests settle
  return user
}

const heading = () => screen.getByRole('heading', { level: 1 })
// The Great Hall also has portal cards that link to the same pages, so look in the main navigation only
const mainNav = () => screen.getByRole('navigation', { name: 'Main' })
const navLink = (name: string) => within(mainNav()).getByRole('link', { name })
const navLinks = () => Array.from(mainNav().querySelectorAll('a'))
const activeNavLinks = () =>
  navLinks().filter((link) => link.getAttribute('aria-current') === 'page').map((link) => link.textContent)

describe('document titles', () => {
  it.each([
    ['/', 'The Great Hall | Gates of Lexoria'],
    ['/lexicon', 'The Lexicon | Gates of Lexoria'],
    ['/memory-scrolls', 'Memory Scrolls | Gates of Lexoria'],
    ['/nope', 'Page not found | Gates of Lexoria'],
    ['/lexicon/unknown-subpage', 'Page not found | Gates of Lexoria'],
  ])('%s has the title "%s"', async (path, title) => {
    await renderApp(path)
    expect(document.title).toBe(title)
  })

  it('updates the title when navigating', async () => {
    const user = await renderApp('/')
    await user.click(navLink('The Lexicon'))
    expect(document.title).toBe('The Lexicon | Gates of Lexoria')

    await user.click(navLink('Memory Scrolls'))
    expect(document.title).toBe('Memory Scrolls | Gates of Lexoria')
  })
})

describe('focus after navigation', () => {
  it.each(['/', '/lexicon', '/memory-scrolls', '/nope'])('does not steal focus on the first load of %s', async (path) => {
    await renderApp(path)
    expect(document.body).toHaveFocus()
  })

  it('moves focus to the new page heading when a link is clicked', async () => {
    const user = await renderApp('/')
    await user.click(navLink('The Lexicon'))

    expect(heading()).toHaveTextContent('The Lexicon')
    expect(heading()).toHaveFocus()
  })

  it('moves focus to the new page heading when navigating with the keyboard', async () => {
    const user = await renderApp('/')
    navLink('Memory Scrolls').focus()
    await user.keyboard('{Enter}')

    expect(heading()).toHaveTextContent('Memory Scrolls')
    expect(heading()).toHaveFocus()
  })

  it('focuses the heading of the Not Found page too, and again when leaving it', async () => {
    const user = await renderApp('/lexicon')
    await user.click(screen.getByRole('button', { name: 'test: go to unknown page' }))

    expect(heading()).toHaveTextContent('Lost in the Stacks')
    expect(heading()).toHaveFocus()
    expect(document.title).toBe('Page not found | Gates of Lexoria')

    await user.click(screen.getByRole('link', { name: 'Return to the Great Hall' }))
    expect(heading()).toHaveTextContent('The Great Hall')
    expect(heading()).toHaveFocus()
  })

  it('also handles the browser back button', async () => {
    const user = await renderApp('/')
    await user.click(navLink('The Lexicon'))
    await user.click(screen.getByRole('button', { name: 'test: go back' }))

    expect(heading()).toHaveTextContent('The Great Hall')
    expect(heading()).toHaveFocus()
    expect(document.title).toBe('The Great Hall | Gates of Lexoria')
  })

  it('leaves focus alone when the current page link is activated again', async () => {
    const user = await renderApp('/lexicon')
    await user.click(navLink('The Lexicon'))

    expect(navLink('The Lexicon')).toHaveFocus()
  })

  it('keeps the page headings out of the Tab order', async () => {
    const user = await renderApp('/')
    await user.click(navLink('The Lexicon'))
    expect(heading()).toHaveAttribute('tabindex', '-1')

    const visited: Element[] = []
    for (let i = 0; i < 15; i++) {
      await user.tab()
      visited.push(document.activeElement as Element)
    }
    expect(visited).not.toContain(heading())
  })
})

describe('skip link and active navigation', () => {
  it('keeps the skip link pointing at the main landmark', async () => {
    await renderApp('/')
    const skip = screen.getByRole('link', { name: 'Skip to content' })

    expect(skip).toHaveAttribute('href', '#main-content')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content')
  })

  it('makes the skip link the first Tab stop', async () => {
    const user = await renderApp('/')
    await user.tab()
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveFocus()
  })

  it('marks only the current page in the navigation, before and after navigating', async () => {
    const user = await renderApp('/')
    expect(activeNavLinks()).toEqual(['The Great Hall'])

    await user.click(navLink('The Lexicon'))
    expect(activeNavLinks()).toEqual(['The Lexicon'])

    await user.click(screen.getByRole('button', { name: 'test: go to unknown page' }))
    expect(activeNavLinks()).toEqual([])
  })
})
