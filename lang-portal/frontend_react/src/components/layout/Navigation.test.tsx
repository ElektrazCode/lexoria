import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import Navigation from './Navigation'

function renderNavigation() {
  const user = userEvent.setup()
  render(
    <MemoryRouter>
      <Navigation />
      <label>
        Elsewhere
        <input />
      </label>
    </MemoryRouter>,
  )
  return user
}

const toggle = () => screen.getByRole('button', { name: /^(Menu|Close)$/ })
const isOpen = () => toggle().getAttribute('aria-expanded') === 'true'
const keydownCalls = (spy: { mock: { calls: unknown[][] } }) => spy.mock.calls.filter(([type]) => type === 'keydown')

describe('mobile menu toggle', () => {
  it('starts closed and opens and closes with the button', async () => {
    const user = renderNavigation()
    expect(isOpen()).toBe(false)
    expect(toggle()).toHaveTextContent('Menu')

    await user.click(toggle())
    expect(isOpen()).toBe(true)
    expect(toggle()).toHaveTextContent('Close')

    await user.click(toggle())
    expect(isOpen()).toBe(false)
  })

  it('still closes when a navigation link is chosen, without moving focus to the toggle', async () => {
    const user = renderNavigation()
    await user.click(toggle())
    const link = screen.getByRole('link', { name: 'The Lexicon' })

    await user.click(link)
    expect(isOpen()).toBe(false)
    expect(toggle()).not.toHaveFocus()
  })
})

describe('Escape closes the open mobile menu', () => {
  it('closes it and keeps focus on the toggle when the toggle has focus', async () => {
    const user = renderNavigation()
    await user.click(toggle())

    await user.keyboard('{Escape}')
    expect(isOpen()).toBe(false)
    expect(toggle()).toHaveFocus()
  })

  it('works keyboard-only: open with Enter, Tab into the links, Escape returns focus to the toggle', async () => {
    const user = renderNavigation()
    await user.tab()
    expect(toggle()).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(isOpen()).toBe(true)

    await user.tab()
    await user.tab()
    expect(screen.getByRole('link', { name: 'The Lexicon' })).toHaveFocus()

    await user.keyboard('{Escape}')
    expect(isOpen()).toBe(false)
    expect(toggle()).toHaveFocus()
  })

  it('closes it and focuses the toggle when focus is on the page background', async () => {
    const user = renderNavigation()
    await user.click(toggle())
    await user.click(document.body)
    expect(document.body).toHaveFocus()

    await user.keyboard('{Escape}')
    expect(isOpen()).toBe(false)
    expect(toggle()).toHaveFocus()
  })

  it('closes it but does not steal focus from another field the user is typing in', async () => {
    const user = renderNavigation()
    await user.click(toggle())
    const field = screen.getByLabelText('Elsewhere')
    await user.click(field)

    await user.keyboard('{Escape}')
    expect(isOpen()).toBe(false)
    expect(field).toHaveFocus()
  })

  it('does nothing when the menu is already closed', async () => {
    const user = renderNavigation()
    const field = screen.getByLabelText('Elsewhere')
    await user.click(field)

    await user.keyboard('{Escape}')
    expect(isOpen()).toBe(false)
    expect(field).toHaveFocus()
  })

  it('ignores other keys', async () => {
    const user = renderNavigation()
    await user.click(toggle())

    await user.keyboard('a')
    await user.keyboard('{ArrowDown}')
    expect(isOpen()).toBe(true)
  })

  it('can be opened and closed with Escape repeatedly', async () => {
    const user = renderNavigation()
    for (let i = 0; i < 3; i++) {
      await user.click(toggle())
      expect(isOpen()).toBe(true)
      await user.keyboard('{Escape}')
      expect(isOpen()).toBe(false)
    }
  })
})

describe('the Escape listener', () => {
  it('exists only while the menu is open, and is removed afterwards and on unmount', async () => {
    const add = vi.spyOn(document, 'addEventListener')
    const remove = vi.spyOn(document, 'removeEventListener')
    const user = userEvent.setup()
    const { unmount } = render(
      <MemoryRouter>
        <Navigation />
      </MemoryRouter>,
    )
    expect(keydownCalls(add)).toHaveLength(0) // nothing registered while closed

    await user.click(toggle())
    expect(keydownCalls(add)).toHaveLength(1)
    expect(keydownCalls(remove)).toHaveLength(0)

    await user.keyboard('{Escape}')
    expect(keydownCalls(remove)).toHaveLength(1) // removed as soon as the menu closes

    await user.click(toggle()) // open again, then leave the page with the menu open
    expect(keydownCalls(add)).toHaveLength(2)
    unmount()
    expect(keydownCalls(remove)).toHaveLength(2)
  })
})
