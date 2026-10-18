/**
 * Normalises text for forgiving searching: case-, accent- and final-sigma-insensitive,
 * so "καλημερα" finds "Καλημέρα" and "ευχαριστω" finds "Ευχαριστώ".
 */
export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/ς/g, 'σ')
}
