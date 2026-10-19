import type { ReactNode } from 'react'
import { getLastStudySession, getQuickStats, getStudyProgress } from '@/api/endpoints'
import scoreboardUrl from '@/assets/images/hall-scoreboard.webp'
import { useApi, type ApiState } from '@/hooks/useApi'

const iconClass = 'size-[1.15em] shrink-0 text-gold-400'

function BookIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" className={iconClass}>
      <path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5ZM12 6.5v13" />
    </svg>
  )
}
function BarsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className={iconClass}>
      <rect x="3.5" y="13" width="4" height="7" rx=".8" />
      <rect x="10" y="8.5" width="4" height="11.5" rx=".8" />
      <rect x="16.5" y="4" width="4" height="16" rx=".8" />
    </svg>
  )
}
function GroupsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" className={iconClass}>
      <path d="m12 3.5 8.5 4.5-8.5 4.5L3.5 8 12 3.5ZM3.5 12.2 12 16.7l8.5-4.5M3.5 16.2 12 20.7l8.5-4.5" />
    </svg>
  )
}

/** Compact for the plaque; the full date and time are given to assistive technology instead. */
function formatShort(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}
function formatFull(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })
}

/** The value of a stat, or a placeholder while loading or after a failed request. */
function valueOf<T>(state: ApiState<T>, pick: (data: T) => ReactNode): ReactNode {
  if (state.status === 'loading') return <span aria-hidden="true">…</span>
  if (state.status === 'error') return <span className="text-[0.62em] font-normal italic text-gold-300">Unavailable</span>
  return pick(state.data)
}

function Stat({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-[3cqw]">
      <dt className="flex items-center gap-[2cqw] text-[6.2cqw] leading-tight text-gold-300">
        {icon}
        {label}
      </dt>
      <dd className="font-display text-[7.6cqw] font-bold leading-none text-gold-100">{children}</dd>
    </div>
  )
}

function ErrorNotice({ message, subject, onRetry }: { message: string; subject: string; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded border border-gold-500 bg-burgundy-950/90 p-3 text-sm leading-snug text-gold-100">
      <p>{message}</p>
      <button
        type="button"
        onClick={onRetry}
        aria-label={`Try again: ${subject}`}
        className="mt-2 rounded border border-gold-400 px-3 py-1 font-display text-gold-100 hover:bg-burgundy-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-100"
      >
        Try again
      </button>
    </div>
  )
}

/**
 * The scoreboard: the finished plaque artwork (kept intact, never stretched) with the library
 * statistics as real text over it. Each request is independent, so one failing endpoint never
 * blocks the others. Failures are reported in notices below the plaque, where long messages can
 * wrap freely instead of being squeezed into the artwork.
 */
function Scoreboard() {
  const quickStats = useApi(getQuickStats)
  const progress = useApi(getStudyProgress)
  const lastSession = useApi(getLastStudySession)

  const sources = [
    { api: quickStats, subject: 'library statistics', loading: 'Loading library statistics…' },
    { api: progress, subject: 'study sessions', loading: 'Loading study sessions…' },
    { api: lastSession, subject: 'last study session', loading: 'Loading last study session…' },
  ]

  return (
    <section aria-labelledby="scoreboard-heading" className="w-[min(86vw,22rem)] lg:w-[clamp(16rem,20vw,22rem)]">
      <h2 id="scoreboard-heading" className="sr-only">
        The library at a glance
      </h2>

      <div className="relative aspect-[800/520] [container-type:inline-size]">
        <img src={scoreboardUrl} width={800} height={520} alt="" aria-hidden="true" className="absolute inset-0 size-full select-none" />
        <dl className="absolute inset-x-[15%] inset-y-[15%] flex flex-col justify-center gap-[2.4cqw] [text-shadow:0_1px_2px_var(--color-burgundy-950)]">
          <Stat icon={<BookIcon />} label="Words">
            {valueOf(quickStats.state, (d) => d.total_words)}
          </Stat>
          <Stat icon={<BarsIcon />} label="Sessions">
            {valueOf(progress.state, (d) => d.total_sessions)}
          </Stat>
          <Stat icon={<GroupsIcon />} label="Word Groups">
            {valueOf(quickStats.state, (d) => d.total_groups)}
          </Stat>
          <div className="mt-[1cqw] border-t border-gold-500/50 pt-[2cqw] text-[5.2cqw] leading-snug">
            <dt className="text-gold-300">Last Session</dt>
            <dd className="text-gold-100">
              {valueOf(lastSession.state, ({ session }) =>
                session ? (
                  <>
                    <span aria-hidden="true">
                      {formatShort(session.created_at)} · Group #{session.group_id}
                    </span>
                    <span className="sr-only">
                      {formatFull(session.created_at)}, Group #{session.group_id}
                    </span>
                  </>
                ) : (
                  'You have not studied yet.'
                ),
              )}
            </dd>
          </div>
        </dl>
      </div>

      {sources.map(({ api, subject, loading }) =>
        api.state.status === 'loading' ? (
          <p key={subject} role="status" className="sr-only">
            {loading}
          </p>
        ) : api.state.status === 'error' ? (
          <div key={subject} className="mt-2">
            <ErrorNotice message={api.state.error.message} subject={subject} onRetry={api.reload} />
          </div>
        ) : null,
      )}
    </section>
  )
}

export default Scoreboard
