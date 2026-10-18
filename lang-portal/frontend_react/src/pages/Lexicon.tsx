import { useMemo, useState } from 'react'
import { getWords } from '@/api/endpoints'
import Button from '@/components/Button'
import ErrorNotice from '@/components/ErrorNotice'
import PageHeader from '@/components/PageHeader'
import WordTable from '@/components/WordTable'
import { useApi } from '@/hooks/useApi'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { normalizeForSearch } from '@/utils/search'

const plural = (count: number) => `${count} ${count === 1 ? 'word' : 'words'}`

function Lexicon() {
  useDocumentTitle('The Lexicon')
  const { state, reload } = useApi(getWords)
  const [query, setQuery] = useState('')

  const words = state.status === 'success' ? state.data : null
  const matches = useMemo(() => {
    if (!words) return []
    const needle = normalizeForSearch(query.trim())
    if (!needle) return words
    return words.filter(
      (word) =>
        normalizeForSearch(word.target_word).includes(needle) ||
        normalizeForSearch(word.english).includes(needle),
    )
  }, [words, query])

  return (
    <>
      <PageHeader title="The Lexicon">
        The library’s complete collection of Greek words and their meanings.
      </PageHeader>

      {state.status === 'loading' && <p role="status">Loading the Lexicon…</p>}

      {state.status === 'error' && (
        <ErrorNotice
          title="The Lexicon could not be opened."
          message={state.error.message}
          subject="Lexicon"
          onRetry={reload}
        />
      )}

      {words && words.length === 0 && (
        <p className="rounded-lg border border-dashed border-parchment-400 p-6 text-ink-600">
          No words have been added to the Lexicon yet.
        </p>
      )}

      {words && words.length > 0 && (
        <>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <label htmlFor="lexicon-search" className="block font-display text-sm text-ink-900">
                Search words
              </label>
              <input
                id="lexicon-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Greek or English"
                autoComplete="off"
                // sage-700 border: 5.0:1 against the page, 5.5:1 against the field (WCAG non-text 3:1);
                // sage-700 placeholder: 5.5:1 against the field (WCAG text 4.5:1)
                className="mt-1 w-full rounded border border-sage-700 bg-parchment-50 px-3 py-2 placeholder:text-sage-700 sm:w-80"
              />
            </div>
            <p role="status" className="text-ink-600">
              {query.trim()
                ? `${matches.length} of ${plural(words.length)} match`
                : plural(words.length)}
            </p>
          </div>

          {matches.length > 0 ? (
            <WordTable words={matches} />
          ) : (
            <div className="rounded-lg border border-dashed border-parchment-400 p-6">
              <p className="text-ink-800">No words match “{query.trim()}”.</p>
              <Button variant="secondary" className="mt-3" onClick={() => setQuery('')}>
                Clear search
              </Button>
            </div>
          )}
        </>
      )}
    </>
  )
}

export default Lexicon
