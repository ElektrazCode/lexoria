import type { Word } from '@/api/types'

export type Answer = 'knew' | 'review'
export type RoundKind = 'full' | 'review'

/** All practice state for one round. Answers are keyed by word ID, never by position. */
export interface RoundState {
  kind: RoundKind
  /** Cards in the order they are practised. Fixed when the round starts. */
  deck: Word[]
  index: number
  /** true while the answer side is showing */
  flipped: boolean
  answers: Record<number, Answer>
}

export type RoundAction =
  | { type: 'start'; deck: Word[]; kind: RoundKind }
  | { type: 'flip' }
  | { type: 'resetSide' }
  | { type: 'goTo'; index: number }
  | { type: 'answer'; answer: Answer }

export function newRound(deck: Word[], kind: RoundKind = 'full'): RoundState {
  return { kind, deck, index: 0, flipped: false, answers: {} }
}

/** Returns a shuffled copy (Fisher–Yates). Call it when a round starts, not while rendering. */
export function shuffled<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function roundReducer(state: RoundState, action: RoundAction): RoundState {
  switch (action.type) {
    case 'start':
      return newRound(action.deck, action.kind)
    case 'flip':
      return { ...state, flipped: !state.flipped }
    case 'resetSide':
      return { ...state, flipped: false }
    case 'goTo': {
      if (action.index < 0 || action.index >= state.deck.length) return state
      return { ...state, index: action.index, flipped: false }
    }
    case 'answer': {
      const card = state.deck[state.index]
      if (!card) return state
      // Same key every time, so re-answering a card replaces its answer instead of adding another.
      const answers = { ...state.answers, [card.id]: action.answer }
      // Continue with the next unanswered card (wrapping round); stay put if none is left.
      let next = state.index
      for (let step = 1; step <= state.deck.length; step++) {
        const candidate = (state.index + step) % state.deck.length
        if (!answers[state.deck[candidate].id]) {
          next = candidate
          break
        }
      }
      return { ...state, answers, index: next, flipped: false }
    }
  }
}

export interface RoundSummary {
  total: number
  answered: number
  knew: number
  review: number
  complete: boolean
  /** Cards marked "Review again", in deck order */
  missed: Word[]
}

export function summarize(state: RoundState): RoundSummary {
  const total = state.deck.length
  const missed = state.deck.filter((word) => state.answers[word.id] === 'review')
  const knew = state.deck.filter((word) => state.answers[word.id] === 'knew').length
  const answered = knew + missed.length
  return { total, answered, knew, review: missed.length, complete: total > 0 && answered === total, missed }
}
