import type { ReactNode } from 'react'
import { getLastStudySession, getQuickStats, getStudyProgress } from '@/api/endpoints'
import ButtonLink from '@/components/ButtonLink'
import Card from '@/components/Card'
import ComingSoonActivities from '@/components/ComingSoonActivities'
import ErrorNotice from '@/components/ErrorNotice'
import PageHeader from '@/components/PageHeader'
import { useApi, type ApiState } from '@/hooks/useApi'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

/** Renders loading / error (with retry) for one data source, or `children(data)` on success. */
function Section<T>({
  state,
  reload,
  subject,
  children,
}: {
  state: ApiState<T>
  reload: () => void
  subject: string
  children: (data: T) => ReactNode
}) {
  if (state.status === 'loading') return <p role="status">Loading…</p>
  if (state.status === 'error') {
    return <ErrorNotice message={state.error.message} subject={subject} onRetry={reload} />
  }
  return <>{children(state.data)}</>
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-sm text-ink-600">{label}</dt>
      <dd className="font-display text-4xl font-bold text-burgundy-700">{value}</dd>
    </div>
  )
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })
}

// Each card owns its request, so one failing endpoint never blocks the others.
function GreatHall() {
  useDocumentTitle('The Great Hall')
  const quickStats = useApi(getQuickStats)
  const progress = useApi(getStudyProgress)
  const lastSession = useApi(getLastStudySession)

  return (
    <>
      <PageHeader title="The Great Hall">
        Welcome, scholar. Here you can see the state of the library and choose where to study next.
      </PageHeader>

      <section aria-labelledby="overview-heading">
        <h2 id="overview-heading" className="sr-only">
          Overview
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card title="The Library">
            <Section {...quickStats} subject="library statistics">
              {(stats) => (
                <dl className="flex gap-8">
                  <Stat label="Words in the Lexicon" value={stats.total_words} />
                  <Stat label="Word groups" value={stats.total_groups} />
                </dl>
              )}
            </Section>
          </Card>

          <Card title="Study Sessions">
            <Section {...progress} subject="study sessions">
              {(data) => (
                <dl>
                  <Stat label="Sessions recorded" value={data.total_sessions} />
                </dl>
              )}
            </Section>
          </Card>

          <Card title="Last Study Session">
            <Section {...lastSession} subject="last study session">
              {({ session }) =>
                session ? (
                  <dl>
                    <dt className="text-sm text-ink-600">When</dt>
                    <dd className="text-ink-900">{formatDate(session.created_at)}</dd>
                    <dt className="mt-2 text-sm text-ink-600">Word group</dt>
                    <dd className="text-ink-900">Group #{session.group_id}</dd>
                  </dl>
                ) : (
                  <p>You have not studied yet. Your first session will appear here.</p>
                )
              }
            </Section>
          </Card>
        </div>
      </section>

      <nav aria-label="Where to next" className="mt-8 flex flex-wrap gap-3">
        <ButtonLink to="/memory-scrolls">Open the Memory Scrolls</ButtonLink>
        <ButtonLink to="/lexicon" variant="secondary">
          Browse the Lexicon
        </ButtonLink>
      </nav>

      <ComingSoonActivities />
    </>
  )
}

export default GreatHall
