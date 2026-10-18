import type { ReactNode } from 'react'

interface CardProps {
  title: string
  badge?: string
  children: ReactNode
}

/** A parchment card with a heading; `badge` adds a small label such as "Coming soon". */
function Card({ title, badge, children }: CardProps) {
  return (
    <article className="rounded-lg border border-parchment-300 bg-parchment-50 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg font-bold text-ink-900">{title}</h3>
        {badge && (
          <span className="shrink-0 rounded-full bg-sage-100 px-2.5 py-0.5 text-xs font-medium text-sage-900">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-2 text-ink-600">{children}</div>
    </article>
  )
}

export default Card
