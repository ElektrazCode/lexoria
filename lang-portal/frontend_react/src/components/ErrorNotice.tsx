import Button from './Button'

interface ErrorNoticeProps {
  message: string
  onRetry: () => void
  /** Optional bold heading, e.g. "The Lexicon could not be opened." */
  title?: string
  /** What is being retried; makes the button's accessible name unique when several are on a page. */
  subject: string
}

function ErrorNotice({ message, onRetry, title, subject }: ErrorNoticeProps) {
  return (
    <div role="alert" className="rounded-lg border border-burgundy-300 bg-burgundy-100 p-4">
      {title && <p className="font-display font-bold text-burgundy-900">{title}</p>}
      <p className="text-ink-800">{message}</p>
      <Button className="mt-3" onClick={onRetry} aria-label={`Try again: ${subject}`}>
        Try again
      </Button>
    </div>
  )
}

export default ErrorNotice
