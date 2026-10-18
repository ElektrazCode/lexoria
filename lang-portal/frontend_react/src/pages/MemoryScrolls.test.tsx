import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/client'
import { getWords } from '@/api/endpoints'
import { words } from '@/test/fixtures'
import { renderPage } from '@/test/render'
import MemoryScrolls from './MemoryScrolls'

vi.mock('@/api/endpoints')

type User = ReturnType<typeof renderPage>

async function openCards() {
  vi.mocked(getWords).mockResolvedValue(words)
  const user = renderPage(<MemoryScrolls />)
  await screen.findByText(/Card 1 of/)
  return user
}

const faceText = () => screen.getByLabelText('Flashcard').querySelector('[aria-live]')?.textContent
const progressText = () => screen.getByText(/answered ·/).textContent
const flip = (user: User) => user.click(screen.getByRole('button', { name: 'Flip card' }))
const mark = (user: User, name: 'I knew it' | 'Review again') => user.click(screen.getByRole('button', { name }))

/** Flips the current card and marks it; the page then moves on to the next unanswered card. */
async function flipAndMark(user: User, ...answers: ('I knew it' | 'Review again')[]) {
  for (const answer of answers) {
    await flip(user)
    await mark(user, answer)
  }
}

describe('Memory Scrolls: loading states', () => {
  it('shows a loading message', () => {
    vi.mocked(getWords).mockReturnValue(new Promise(() => {}))
    renderPage(<MemoryScrolls />)
    expect(screen.getByRole('status')).toHaveTextContent('Unrolling the scrolls')
  })

  it('shows the error and recovers with Try again', async () => {
    vi.mocked(getWords).mockRejectedValueOnce(new ApiError('Backend exploded', 500)).mockResolvedValue(words)
    const user = renderPage(<MemoryScrolls />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Backend exploded')
    await user.click(screen.getByRole('button', { name: 'Try again: Memory Scrolls' }))
    expect(await screen.findByText('Card 1 of 4')).toBeInTheDocument()
  })

  it('shows an empty state without any card controls when there is no vocabulary', async () => {
    vi.mocked(getWords).mockResolvedValue([])
    renderPage(<MemoryScrolls />)
    expect(await screen.findByText(/no words to practise/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Flip card' })).not.toBeInTheDocument()
  })
})

describe('Memory Scrolls: a card', () => {
  it('shows the first Greek word as a question, with its position and total', async () => {
    await openCards()
    expect(screen.getByText('Card 1 of 4')).toBeInTheDocument()
    expect(faceText()).toBe('Γεια σου')
    expect(screen.getByText('Greek · question')).toBeInTheDocument()
    expect(screen.getByLabelText('Flashcard').querySelector('[lang="el"]')).toBeInTheDocument()
  })

  it('flips between question and answer and says which side is visible', async () => {
    const user = await openCards()
    await flip(user)
    expect(faceText()).toBe('Hello (informal)')
    expect(screen.getByText('English · answer')).toBeInTheDocument()
    await flip(user)
    expect(faceText()).toBe('Γεια σου')
  })

  it('switching direction returns to the question side, now English', async () => {
    const user = await openCards()
    await flip(user)
    await user.click(screen.getByLabelText('English → Greek'))
    expect(screen.getByText('English · question')).toBeInTheDocument()
    expect(faceText()).toBe('Hello (informal)')
    await flip(user)
    expect(faceText()).toBe('Γεια σου')
  })

  it('navigates with Previous/Next, resets the side, and disables them at the ends', async () => {
    const user = await openCards()
    const previous = screen.getByRole('button', { name: 'Previous' })
    const next = screen.getByRole('button', { name: 'Next' })
    expect(previous).toBeDisabled()

    await flip(user)
    await user.click(next)
    expect(screen.getByText('Card 2 of 4')).toBeInTheDocument()
    expect(faceText()).toBe('Καλημέρα') // question side again

    await user.click(next)
    await user.click(next)
    expect(screen.getByText('Card 4 of 4')).toBeInTheDocument()
    expect(next).toBeDisabled()
    await user.click(previous)
    expect(screen.getByText('Card 3 of 4')).toBeInTheDocument()
  })
})

describe('Memory Scrolls: shuffle', () => {
  it('shuffles once when the round starts, not on later interaction', async () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0)
    const user = await openCards()
    expect(random).not.toHaveBeenCalled() // ordered by default

    await user.click(screen.getByLabelText('Shuffled'))
    const afterStart = random.mock.calls.length
    expect(afterStart).toBe(words.length - 1)
    expect(faceText()).toBe('Καλημέρα') // with random()=0 the deck is [2, 3, 4, 1]

    await flip(user)
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByLabelText('English → Greek'))
    expect(random).toHaveBeenCalledTimes(afterStart)

    await user.click(screen.getByRole('button', { name: 'Start over' }))
    expect(random).toHaveBeenCalledTimes(afterStart * 2) // a new round reshuffles
  })
})

describe('Memory Scrolls: answers', () => {
  it('moves to the next card after marking and updates the progress', async () => {
    const user = await openCards()
    expect(progressText()).toMatch(/Full deck · 0 of 4 answered · 0 knew it · 0 to review/)

    await flipAndMark(user, 'I knew it')
    expect(screen.getByText('Card 2 of 4')).toBeInTheDocument()
    expect(progressText()).toMatch(/1 of 4 answered · 1 knew it · 0 to review/)
  })

  it('only offers the marking buttons once the answer has been seen', async () => {
    const user = await openCards()
    expect(screen.queryByRole('button', { name: 'I knew it' })).not.toBeInTheDocument()
    await flip(user)
    expect(screen.getByRole('button', { name: 'I knew it' })).toBeInTheDocument()
  })

  it('does not double count when a card is revisited and re-marked', async () => {
    const user = await openCards()
    await flipAndMark(user, 'I knew it')

    await user.click(screen.getByRole('button', { name: 'Previous' }))
    expect(screen.getByText('Marked: I knew it')).toBeInTheDocument()

    // The buttons are available again without flipping; change the answer, then repeat it
    await mark(user, 'Review again')
    expect(progressText()).toMatch(/1 of 4 answered · 0 knew it · 1 to review/)

    await user.click(screen.getByRole('button', { name: 'Previous' }))
    await mark(user, 'Review again')
    expect(progressText()).toMatch(/1 of 4 answered · 0 knew it · 1 to review/)
    expect(screen.getByRole('progressbar', { name: 'Round progress' })).toHaveAttribute('value', '1')
  })

  it('returns to a skipped card before the round can finish', async () => {
    const user = await openCards()
    await user.click(screen.getByRole('button', { name: 'Next' })) // skip card 1
    await flipAndMark(user, 'I knew it', 'I knew it', 'I knew it') // cards 2–4

    expect(screen.queryByRole('heading', { name: 'Round complete' })).not.toBeInTheDocument()
    expect(screen.getByText('Card 1 of 4')).toBeInTheDocument()
  })

  it('keeps keyboard focus on the Flip button after marking', async () => {
    const user = await openCards()
    await flip(user)
    await mark(user, 'I knew it')
    expect(screen.getByRole('button', { name: 'Flip card' })).toHaveFocus()
  })
})

describe('Memory Scrolls: finishing a round', () => {
  async function finishWithTwoMissed() {
    const user = await openCards()
    await flipAndMark(user, 'Review again', 'I knew it', 'Review again', 'I knew it')
    return user
  }

  it('shows a summary with the counts, the missed cards, and that nothing is saved', async () => {
    await finishWithTwoMissed()

    expect(screen.getByRole('heading', { name: 'Round complete' })).toBeInTheDocument()
    expect(screen.getByText('You knew 2 of 4 cards; 2 to review again.')).toBeInTheDocument()
    expect(screen.getByText(/not saved/)).toBeInTheDocument()
    const missed = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(missed.map((item) => item.textContent)).toEqual(['Γεια σουHello (informal)', 'ΕυχαριστώThank you'])
  })

  it('runs a review round on just the missed cards, then offers another round if needed', async () => {
    const user = await finishWithTwoMissed()

    await user.click(screen.getByRole('button', { name: 'Review missed cards (2)' }))
    expect(screen.getByText('Card 1 of 2')).toBeInTheDocument()
    expect(progressText()).toMatch(/Review round · 0 of 2 answered/)
    expect(faceText()).toBe('Γεια σου')

    await flipAndMark(user, 'I knew it', 'Review again')
    expect(screen.getByRole('heading', { name: 'Review round complete' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Review missed cards (1)' })).toBeInTheDocument()
  })

  it('starts over with the full deck', async () => {
    const user = await finishWithTwoMissed()
    await user.click(screen.getByRole('button', { name: 'Review missed cards (2)' }))
    await flipAndMark(user, 'I knew it', 'I knew it')

    expect(screen.queryByRole('button', { name: /Review missed cards/ })).not.toBeInTheDocument() // a perfect round
    await user.click(screen.getByRole('button', { name: 'Start over with the full deck' }))

    expect(screen.getByText('Card 1 of 4')).toBeInTheDocument()
    expect(progressText()).toMatch(/Full deck · 0 of 4 answered/)
  })

  it('lets a restart mid-round discard progress', async () => {
    const user = await openCards()
    await flipAndMark(user, 'I knew it')
    await user.click(screen.getByRole('button', { name: 'Start over' }))
    await waitFor(() => expect(progressText()).toMatch(/0 of 4 answered/))
    expect(screen.getByText('Card 1 of 4')).toBeInTheDocument()
  })
})

describe('Memory Scrolls: focus management', () => {
  const finishRound = async (user: User) => {
    await flipAndMark(user, 'Review again', 'I knew it', 'Review again', 'I knew it')
  }

  it('does not move focus on first render', async () => {
    await openCards()
    expect(document.body).toHaveFocus()
  })

  it('moves focus to the summary heading when the round completes', async () => {
    const user = await openCards()
    await finishRound(user)

    expect(screen.getByRole('heading', { name: 'Round complete' })).toHaveFocus()
  })

  it('lets screen readers hear the result together with the heading', async () => {
    const user = await openCards()
    await finishRound(user)

    expect(screen.getByRole('heading', { name: 'Round complete' })).toHaveAccessibleDescription(
      'You knew 2 of 4 cards; 2 to review again.',
    )
  })

  it('does not jump to the summary before the last card is answered', async () => {
    const user = await openCards()
    await flipAndMark(user, 'I knew it', 'I knew it', 'I knew it')

    expect(screen.queryByRole('heading', { name: 'Round complete' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Flip card' })).toHaveFocus()
  })

  it('moves focus to the Flip button when a review round starts', async () => {
    const user = await openCards()
    await finishRound(user)

    await user.click(screen.getByRole('button', { name: 'Review missed cards (2)' }))
    expect(screen.getByText('Card 1 of 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Flip card' })).toHaveFocus()
  })

  it('moves focus to the Flip button when starting over from the summary', async () => {
    const user = await openCards()
    await finishRound(user)

    await user.click(screen.getByRole('button', { name: 'Start over with the full deck' }))
    expect(screen.getByText('Card 1 of 4')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Flip card' })).toHaveFocus()
  })

  it('moves focus to the Flip button when starting over mid-round', async () => {
    const user = await openCards()
    await flipAndMark(user, 'I knew it')

    await user.click(screen.getByRole('button', { name: 'Start over' }))
    expect(screen.getByText('Card 1 of 4')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Flip card' })).toHaveFocus()
  })

  it('moves focus to the summary heading again when a review round completes', async () => {
    const user = await openCards()
    await finishRound(user)
    await user.click(screen.getByRole('button', { name: 'Review missed cards (2)' }))
    await flipAndMark(user, 'I knew it', 'I knew it')

    expect(screen.getByRole('heading', { name: 'Review round complete' })).toHaveFocus()
  })

  it('keeps focus on the radio buttons when changing direction or order', async () => {
    const user = await openCards()

    await user.click(screen.getByLabelText('English → Greek'))
    expect(screen.getByLabelText('English → Greek')).toHaveFocus()

    await user.click(screen.getByLabelText('Shuffled'))
    expect(screen.getByLabelText('Shuffled')).toHaveFocus()
  })

  it('keeps the heading out of the Tab order (it is only focused by script)', async () => {
    const user = await openCards()
    await finishRound(user)

    const heading = screen.getByRole('heading', { name: 'Round complete' })
    expect(heading).toHaveAttribute('tabindex', '-1')
    const visited: Element[] = []
    for (let i = 0; i < 12; i++) {
      await user.tab()
      visited.push(document.activeElement as Element)
    }
    expect(visited).not.toContain(heading)
  })
})
