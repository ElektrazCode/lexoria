import type { Ref } from 'react'
import type { Word } from '@/api/types'
import Button from '@/components/Button'

export type Direction = 'greek-to-english' | 'english-to-greek'

interface FlashcardProps {
  word: Word
  direction: Direction
  flipped: boolean
  onFlip: () => void
  /** Lets the parent move keyboard focus to the flip button */
  flipRef?: Ref<HTMLButtonElement>
}

/** One flashcard face at a time; the flip button swaps question and answer. */
function Flashcard({ word, direction, flipped, onFlip, flipRef }: FlashcardProps) {
  const greekFirst = direction === 'greek-to-english'
  const showGreek = greekFirst !== flipped // XOR: Greek is visible on the question side of Greek → English
  const text = showGreek ? word.target_word : word.english
  const language = showGreek ? 'Greek' : 'English'

  return (
    <div className="rounded-lg border border-parchment-300 bg-parchment-50 p-6 text-center shadow-sm">
      <p className="font-display text-sm text-ink-600">
        {language} · {flipped ? 'answer' : 'question'}
      </p>
      <p
        lang={showGreek ? 'el' : 'en'}
        aria-live="polite"
        className={`my-8 break-words text-4xl font-medium sm:text-5xl ${showGreek ? 'text-burgundy-700' : 'text-ink-900'}`}
      >
        {text}
      </p>
      <Button ref={flipRef} variant="secondary" onClick={onFlip}>
        Flip card
      </Button>
    </div>
  )
}

export default Flashcard
