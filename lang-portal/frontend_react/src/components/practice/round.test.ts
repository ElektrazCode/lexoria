import { describe, expect, it, vi } from 'vitest'
import { words } from '@/test/fixtures'
import { newRound, roundReducer, shuffled, summarize, type RoundState } from './round'

const start = () => newRound(words)
const answerAs = (state: RoundState, ...answers: ('knew' | 'review')[]) =>
  answers.reduce((s, answer) => roundReducer(s, { type: 'answer', answer }), state)

describe('roundReducer', () => {
  it('starts at the first card, unflipped, with no answers', () => {
    expect(start()).toEqual({ kind: 'full', deck: words, index: 0, flipped: false, answers: {} })
  })

  it('flips back and forth, and resetSide always returns to the question', () => {
    const flipped = roundReducer(start(), { type: 'flip' })
    expect(flipped.flipped).toBe(true)
    expect(roundReducer(flipped, { type: 'flip' }).flipped).toBe(false)
    expect(roundReducer(flipped, { type: 'resetSide' }).flipped).toBe(false)
  })

  it('goTo moves within the deck, resets the side, and ignores out-of-range indexes', () => {
    const flipped = roundReducer(start(), { type: 'flip' })
    const moved = roundReducer(flipped, { type: 'goTo', index: 2 })
    expect(moved).toMatchObject({ index: 2, flipped: false })
    expect(roundReducer(moved, { type: 'goTo', index: -1 })).toBe(moved)
    expect(roundReducer(moved, { type: 'goTo', index: words.length })).toBe(moved)
  })

  it('records answers by word id and advances to the next unanswered card', () => {
    const state = roundReducer(start(), { type: 'answer', answer: 'knew' })
    expect(state.answers).toEqual({ 1: 'knew' })
    expect(state.index).toBe(1)
    expect(state.flipped).toBe(false)
  })

  it('replaces an earlier answer instead of adding a second one', () => {
    let state = answerAs(start(), 'knew')
    state = roundReducer(state, { type: 'goTo', index: 0 })
    state = roundReducer(state, { type: 'answer', answer: 'review' })
    expect(state.answers).toEqual({ 1: 'review' })
    expect(summarize(state)).toMatchObject({ answered: 1, knew: 0, review: 1 })
  })

  it('keys answers by id, not position: the same word keeps its answer in a reordered deck', () => {
    const state = answerAs(start(), 'review')
    const reordered = { ...state, deck: [...state.deck].reverse() }
    expect(summarize(reordered).missed.map((w) => w.id)).toEqual([1])
  })

  it('skips answered cards and wraps round to an unanswered one', () => {
    let state = roundReducer(start(), { type: 'goTo', index: 3 })
    state = answerAs(state, 'knew') // card 4 answered; next unanswered wraps to card 1
    expect(state.index).toBe(0)
    state = answerAs(state, 'knew') // card 1 → card 2
    expect(state.index).toBe(1)
  })

  it('stays on the last card when every card is answered', () => {
    const state = answerAs(start(), 'knew', 'knew', 'knew', 'review')
    expect(summarize(state).complete).toBe(true)
    expect(state.index).toBe(3)
  })

  it('ignores answers on an empty deck', () => {
    const empty = newRound([])
    expect(roundReducer(empty, { type: 'answer', answer: 'knew' })).toBe(empty)
  })

  it('start replaces everything, including the kind', () => {
    const state = answerAs(start(), 'knew')
    const review = roundReducer(state, { type: 'start', deck: [words[0]], kind: 'review' })
    expect(review).toEqual({ kind: 'review', deck: [words[0]], index: 0, flipped: false, answers: {} })
  })
})

describe('summarize', () => {
  it('counts answers and lists missed cards in deck order', () => {
    const state = answerAs(start(), 'review', 'knew', 'review')
    expect(summarize(state)).toMatchObject({ total: 4, answered: 3, knew: 1, review: 2, complete: false })
    expect(summarize(state).missed.map((w) => w.id)).toEqual([1, 3])
  })

  it('is complete only when every card is answered', () => {
    expect(summarize(answerAs(start(), 'knew', 'knew', 'knew', 'knew')).complete).toBe(true)
  })

  it('never reports an empty deck as complete', () => {
    expect(summarize(newRound([]))).toMatchObject({ total: 0, answered: 0, complete: false })
  })
})

describe('shuffled', () => {
  it('returns a permutation and leaves the input untouched', () => {
    const input = [1, 2, 3, 4, 5]
    const snapshot = [...input]
    const result = shuffled(input)
    expect(input).toEqual(snapshot)
    expect([...result].sort()).toEqual(snapshot)
  })

  it('is deterministic for a fixed random source', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    expect(shuffled([1, 2, 3, 4])).toEqual([2, 3, 4, 1])
  })

  it('draws random numbers once per swap (n − 1 times)', () => {
    const random = vi.spyOn(Math, 'random')
    shuffled([1, 2, 3, 4, 5])
    expect(random).toHaveBeenCalledTimes(4)
  })

  it('handles empty and single-item lists', () => {
    expect(shuffled([])).toEqual([])
    expect(shuffled([7])).toEqual([7])
  })
})
