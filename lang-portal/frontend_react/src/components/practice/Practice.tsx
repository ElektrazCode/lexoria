import { useEffect, useReducer, useRef, useState } from 'react'
import type { Word } from '@/api/types'
import Button from '@/components/Button'
import Flashcard, { type Direction } from './Flashcard'
import { newRound, roundReducer, shuffled, summarize, type Answer, type RoundKind } from './round'
import Summary from './Summary'

type Order = 'ordered' | 'shuffled'

function Practice({ words }: { words: Word[] }) {
  const [direction, setDirection] = useState<Direction>('greek-to-english')
  const [order, setOrder] = useState<Order>('ordered')
  const [round, dispatch] = useReducer(roundReducer, words, (all) => newRound(all))
  const flipRef = useRef<HTMLButtonElement>(null)
  const summaryHeadingRef = useRef<HTMLHeadingElement>(null)
  const focusFlipAfterRender = useRef(false)
  const wasComplete = useRef(false)

  const summary = summarize(round)

  // Focus management, only when something actually changed (never on first render):
  //  - the round just completed -> the summary heading (its result is read out with it)
  //  - a new round was started from a button -> the new round's Flip button
  // Radio changes (direction/order) deliberately keep focus where it is.
  useEffect(() => {
    if (summary.complete && !wasComplete.current) summaryHeadingRef.current?.focus()
    else if (focusFlipAfterRender.current) flipRef.current?.focus()
    focusFlipAfterRender.current = false
    wasComplete.current = summary.complete
  }, [round, summary.complete])

  const card = round.deck[round.index]
  const currentAnswer = card ? round.answers[card.id] : undefined

  // Shuffling happens here, once per round start, never during render.
  function startRound(source: Word[], kind: RoundKind = 'full', nextOrder: Order = order) {
    dispatch({ type: 'start', deck: nextOrder === 'shuffled' ? shuffled(source) : source, kind })
  }

  /** Starts a round from a button press: focus then moves to the new round's Flip button. */
  function startRoundFromButton(source: Word[], kind: RoundKind = 'full') {
    focusFlipAfterRender.current = true
    startRound(source, kind)
  }

  function changeDirection(next: Direction) {
    setDirection(next)
    dispatch({ type: 'resetSide' })
  }

  function changeOrder(next: Order) {
    setOrder(next)
    startRound(words, 'full', next)
  }

  function goTo(index: number) {
    dispatch({ type: 'goTo', index })
    flipRef.current?.focus() // keep keyboard focus on the card controls
  }

  function answer(value: Answer) {
    dispatch({ type: 'answer', answer: value })
    flipRef.current?.focus()
  }

  return (
    <div className="space-y-6 accent-burgundy-700">
      <div className="flex flex-wrap gap-x-10 gap-y-4">
        <fieldset>
          <legend className="font-display text-sm text-ink-900">Practice direction</legend>
          <label className="mr-4 inline-flex items-center gap-2">
            <input type="radio" name="direction" checked={direction === 'greek-to-english'} onChange={() => changeDirection('greek-to-english')} />
            Greek → English
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="direction" checked={direction === 'english-to-greek'} onChange={() => changeDirection('english-to-greek')} />
            English → Greek
          </label>
        </fieldset>

        <fieldset>
          <legend className="font-display text-sm text-ink-900">Card order (starts a new round)</legend>
          <label className="mr-4 inline-flex items-center gap-2">
            <input type="radio" name="order" checked={order === 'ordered'} onChange={() => changeOrder('ordered')} />
            In order
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="order" checked={order === 'shuffled'} onChange={() => changeOrder('shuffled')} />
            Shuffled
          </label>
        </fieldset>
      </div>

      <div>
        <p className="text-sm text-ink-600">
          {round.kind === 'review' ? 'Review round' : 'Full deck'} · {summary.answered} of {summary.total} answered · {summary.knew} knew it · {summary.review} to review
        </p>
        <progress
          className="mt-1 block h-2 w-full accent-burgundy-700"
          aria-label="Round progress"
          value={summary.answered}
          max={summary.total}
        />
      </div>

      {summary.complete ? (
        <Summary
          kind={round.kind}
          summary={summary}
          headingRef={summaryHeadingRef}
          onReviewMissed={() => startRoundFromButton(summary.missed, 'review')}
          onStartOver={() => startRoundFromButton(words)}
        />
      ) : (
        <section aria-label="Flashcard" className="space-y-4">
          <p className="font-display">
            Card {round.index + 1} of {summary.total}
            {currentAnswer && (
              <span className="ml-3 rounded-full bg-sage-100 px-2.5 py-0.5 text-xs text-sage-900">
                Marked: {currentAnswer === 'knew' ? 'I knew it' : 'Review again'}
              </span>
            )}
          </p>

          <Flashcard flipRef={flipRef} word={card} direction={direction} flipped={round.flipped} onFlip={() => dispatch({ type: 'flip' })} />

          {round.flipped || currentAnswer ? (
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => answer('knew')}>I knew it</Button>
              <Button variant="secondary" onClick={() => answer('review')}>Review again</Button>
            </div>
          ) : (
            <p className="text-ink-600">Flip the card to see the answer, then mark how you did.</p>
          )}

          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" disabled={round.index === 0} onClick={() => goTo(round.index - 1)}>
              Previous
            </Button>
            <Button variant="secondary" disabled={round.index === summary.total - 1} onClick={() => goTo(round.index + 1)}>
              Next
            </Button>
            <Button variant="secondary" onClick={() => startRoundFromButton(words)}>
              Start over
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}

export default Practice
