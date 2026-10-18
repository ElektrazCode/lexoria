import { getWords } from '@/api/endpoints'
import ErrorNotice from '@/components/ErrorNotice'
import PageHeader from '@/components/PageHeader'
import Practice from '@/components/practice/Practice'
import { useApi } from '@/hooks/useApi'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

function MemoryScrolls() {
  useDocumentTitle('Memory Scrolls')
  const { state, reload } = useApi(getWords)

  return (
    <>
      <PageHeader title="Memory Scrolls">
        Flip through vocabulary flashcards and commit new words to memory.
      </PageHeader>

      {state.status === 'loading' && <p role="status">Unrolling the scrolls…</p>}

      {state.status === 'error' && (
        <ErrorNotice
          title="The scrolls could not be unrolled."
          message={state.error.message}
          subject="Memory Scrolls"
          onRetry={reload}
        />
      )}

      {state.status === 'success' &&
        (state.data.length === 0 ? (
          <p className="rounded-lg border border-dashed border-parchment-400 p-6 text-ink-600">
            There are no words to practise yet. Add vocabulary to the Lexicon first.
          </p>
        ) : (
          <Practice words={state.data} />
        ))}
    </>
  )
}

export default MemoryScrolls
