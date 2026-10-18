import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  children?: ReactNode
}

/**
 * Page title with a short introduction and a small decorative rule.
 * The <h1> is focusable by script only (tabIndex -1): Layout moves focus to it after navigation.
 */
function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <header className="mb-8">
      <h1 tabIndex={-1} className="font-display text-3xl font-bold text-burgundy-700 sm:text-4xl">{title}</h1>
      <div aria-hidden="true" className="my-4 flex items-center gap-3 text-parchment-400">
        <span className="h-px w-16 bg-parchment-400" />
        <span className="size-1.5 rotate-45 bg-burgundy-500" />
        <span className="h-px flex-1 bg-parchment-300" />
      </div>
      {children && <p className="max-w-2xl text-ink-600">{children}</p>}
    </header>
  )
}

export default PageHeader
