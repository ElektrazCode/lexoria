import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { getWords } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import { words } from '@/test/fixtures'
import { renderPage } from '@/test/render'
import Lexicon from './Lexicon'

vi.mock('@/api/endpoints')

const rowsOf = () => screen.getAllByRole('row').slice(1) // without the header row
const greekOf = () => rowsOf().map((row) => within(row).getAllByRole('rowheader')[0].textContent)

describe('Lexicon', () => {
  it('shows a loading message while the words load', () => {
    vi.mocked(getWords).mockReturnValue(new Promise(() => {}))
    renderPage(<Lexicon />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading the Lexicon')
  })

  it('lists every word with Greek, English and part of speech, plus the total', async () => {
    vi.mocked(getWords).mockResolvedValue(words)
    renderPage(<Lexicon />)

    expect(await screen.findByRole('table', { name: /vocabulary/i })).toBeInTheDocument()
    expect(greekOf()).toEqual(['Γεια σου', 'Καλημέρα', 'Ευχαριστώ', 'Νερό'])
    expect(within(rowsOf()[0]).getByText('Hello (informal)')).toBeInTheDocument()
    expect(within(rowsOf()[0]).getByText('phrase')).toBeInTheDocument()
    expect(screen.getByText('4 words')).toBeInTheDocument()
    expect(screen.getByText('Γεια σου')).toHaveAttribute('lang', 'el')
  })

  it('shows a fallback when the part of speech is empty', async () => {
    vi.mocked(getWords).mockResolvedValue(words)
    renderPage(<Lexicon />)
    await screen.findByRole('table')
    expect(within(rowsOf()[3]).getByText('Unspecified')).toBeInTheDocument()
  })

  it('searches Greek words, ignoring case and accents', async () => {
    vi.mocked(getWords).mockResolvedValue(words)
    const user = renderPage(<Lexicon />)
    await screen.findByRole('table')
    const search = screen.getByLabelText('Search words')

    await user.type(search, 'ΚΑΛΗΜΕΡΑ') // uppercase and no accent
    expect(greekOf()).toEqual(['Καλημέρα'])
    expect(screen.getByText('1 of 4 words match')).toBeInTheDocument()

    await user.clear(search)
    await user.type(search, 'ευχαριστω') // final accented ώ typed without accent
    expect(greekOf()).toEqual(['Ευχαριστώ'])
  })

  it('searches English translations, ignoring case', async () => {
    vi.mocked(getWords).mockResolvedValue(words)
    const user = renderPage(<Lexicon />)
    await screen.findByRole('table')

    await user.type(screen.getByLabelText('Search words'), 'WATER')
    expect(greekOf()).toEqual(['Νερό'])
  })

  it('shows a no-results state and can clear the search', async () => {
    vi.mocked(getWords).mockResolvedValue(words)
    const user = renderPage(<Lexicon />)
    await screen.findByRole('table')

    await user.type(screen.getByLabelText('Search words'), 'zzz')
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.getByText(/No words match/)).toHaveTextContent('“zzz”')
    expect(screen.getByText('0 of 4 words match')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(rowsOf()).toHaveLength(4)
    expect(screen.getByLabelText('Search words')).toHaveValue('')
  })

  it('styles the search field with the accessible sage-700 border and placeholder colours', async () => {
    vi.mocked(getWords).mockResolvedValue(words)
    renderPage(<Lexicon />)
    const search = await screen.findByLabelText('Search words')

    expect(search).toHaveClass('border-sage-700', 'placeholder:text-sage-700')
    expect(search).not.toHaveClass('border-parchment-400')
    expect(search).toHaveAttribute('placeholder', 'Greek or English')
  })

  it('shows an empty state when the vocabulary is empty', async () => {
    vi.mocked(getWords).mockResolvedValue([])
    renderPage(<Lexicon />)
    expect(await screen.findByText('No words have been added to the Lexicon yet.')).toBeInTheDocument()
    expect(screen.queryByLabelText('Search words')).not.toBeInTheDocument()
  })

  it('shows the error and recovers with Try again', async () => {
    vi.mocked(getWords).mockRejectedValueOnce(new ApiError('Backend exploded', 500)).mockResolvedValue(words)
    const user = renderPage(<Lexicon />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Backend exploded')
    await user.click(screen.getByRole('button', { name: 'Try again: Lexicon' }))

    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument())
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(getWords).toHaveBeenCalledTimes(2)
  })
})
