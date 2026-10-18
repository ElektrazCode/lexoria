import type { Word } from '@/api/types'

// A small, fixed vocabulary shared by the tests (no network, no backend).
export const words: Word[] = [
  { id: 1, target_word: 'Γεια σου', english: 'Hello (informal)', parts: 'phrase' },
  { id: 2, target_word: 'Καλημέρα', english: 'Good morning', parts: 'phrase' },
  { id: 3, target_word: 'Ευχαριστώ', english: 'Thank you', parts: 'verb' },
  { id: 4, target_word: 'Νερό', english: 'Water', parts: '' },
]
