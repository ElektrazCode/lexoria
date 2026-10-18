import type { Word } from '@/api/types'

interface WordTableProps {
  words: Word[]
}

function WordTable({ words }: WordTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-parchment-300 bg-parchment-50">
      <table className="w-full text-left">
        <caption className="sr-only">Greek vocabulary with English translations</caption>
        <thead className="border-b border-parchment-300 bg-parchment-200 font-display text-sm text-ink-900">
          <tr>
            <th scope="col" className="px-4 py-3">Greek</th>
            <th scope="col" className="px-4 py-3">English</th>
            <th scope="col" className="px-4 py-3">Part of speech</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-parchment-200">
          {words.map((word) => (
            <tr key={word.id}>
              <th scope="row" lang="el" className="px-4 py-3 text-xl font-medium text-burgundy-700">
                {word.target_word}
              </th>
              <td className="px-4 py-3">{word.english}</td>
              <td className="px-4 py-3 text-ink-600">
                {word.parts || <span className="italic">Unspecified</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default WordTable
