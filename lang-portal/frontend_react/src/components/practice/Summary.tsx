import type { Ref } from 'react'
import type { RoundKind, RoundSummary } from './round'
import Button from '@/components/Button'

interface SummaryProps {
  kind: RoundKind
  summary: RoundSummary
  onReviewMissed: () => void
  onStartOver: () => void
  /** Lets the parent move keyboard focus to the heading when the round completes */
  headingRef?: Ref<HTMLHeadingElement>
}

function Summary({ kind, summary, onReviewMissed, onStartOver, headingRef }: SummaryProps) {
  return (
    <section aria-labelledby="summary-heading" className="rounded-lg border border-parchment-300 bg-parchment-50 p-6">
      {/* Focused when the round completes; aria-describedby makes screen readers read the result with it */}
      <h2
        ref={headingRef}
        tabIndex={-1}
        id="summary-heading"
        aria-describedby="summary-result"
        className="font-display text-2xl font-bold text-burgundy-700"
      >
        {kind === 'review' ? 'Review round complete' : 'Round complete'}
      </h2>
      <p id="summary-result" className="mt-2">
        You knew {summary.knew} of {summary.total} cards; {summary.review} to review again.
      </p>
      <p className="mt-1 text-sm text-ink-600">Your results are kept in this browser tab only and are not saved.</p>

      {summary.missed.length > 0 && (
        <>
          <h3 className="mt-5 font-display font-bold text-ink-900">Cards to review</h3>
          <ul className="mt-2 divide-y divide-parchment-200">
            {summary.missed.map((word) => (
              <li key={word.id} className="flex justify-between gap-4 py-2">
                <span lang="el" className="text-burgundy-700">{word.target_word}</span>
                <span>{word.english}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        {summary.missed.length > 0 && (
          <Button onClick={onReviewMissed}>Review missed cards ({summary.missed.length})</Button>
        )}
        <Button variant={summary.missed.length > 0 ? 'secondary' : 'primary'} onClick={onStartOver}>
          Start over with the full deck
        </Button>
      </div>
    </section>
  )
}

export default Summary
