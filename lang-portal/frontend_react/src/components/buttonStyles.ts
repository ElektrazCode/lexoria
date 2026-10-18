export type ButtonVariant = 'primary' | 'secondary'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-burgundy-700 text-parchment-50 hover:bg-burgundy-900',
  secondary: 'border border-burgundy-700 text-burgundy-700 hover:bg-burgundy-100',
}

/** Shared look for <Button> and <ButtonLink>. */
export function buttonClasses(variant: ButtonVariant, className = ''): string {
  return `inline-block rounded px-4 py-2 font-display transition-colors ${variants[variant]} ${className}`
}
