/**
 * Reads the real colour tokens from index.css and checks the WCAG contrast of the combinations the
 * Lexicon search field uses, so a theme change cannot silently make them unreadable.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(resolve(__dirname, 'index.css'), 'utf8')
const color = (name: string) => {
  const match = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`))
  if (!match) throw new Error(`token ${name} not found in index.css`)
  return match[1]
}

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
function contrast(a: string, b: string) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

describe('Lexicon search field colours', () => {
  const border = color('sage-700')
  const placeholder = color('sage-700')
  const fieldBackground = color('parchment-50')
  const pageBackground = color('parchment-100')

  it('has a border of at least 3:1 against the field and against the page (WCAG 1.4.11)', () => {
    expect(contrast(border, fieldBackground)).toBeGreaterThanOrEqual(3)
    expect(contrast(border, pageBackground)).toBeGreaterThanOrEqual(3)
  })

  it('has placeholder text of at least 4.5:1 against the field (WCAG 1.4.3)', () => {
    expect(contrast(placeholder, fieldBackground)).toBeGreaterThanOrEqual(4.5)
  })

  it('is better than the old parchment-400 border, which failed', () => {
    expect(contrast(color('parchment-400'), pageBackground)).toBeLessThan(3)
  })
})
