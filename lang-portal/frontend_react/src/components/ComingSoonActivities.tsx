import Card from './Card'

// Static for now; these will come from the backend once the activities exist.
const activities = [
  { title: 'Trial of Wits', description: 'Multiple-choice challenges to test the words you have gathered.' },
  { title: 'The Matching Hall', description: 'Pair Greek words with their meanings against the clock.' },
  { title: 'Scribe’s Table', description: 'Practise writing Greek words from memory.' },
]

function ComingSoonActivities() {
  return (
    <section aria-labelledby="coming-soon-heading" className="mt-12">
      <h2 id="coming-soon-heading" className="font-display text-2xl font-bold text-burgundy-700">
        Coming Soon
      </h2>
      <p className="mt-1 text-ink-600">More ways to study are being prepared in the library.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {activities.map(({ title, description }) => (
          <Card key={title} title={title} badge="Coming soon">
            {description}
          </Card>
        ))}
      </div>
    </section>
  )
}

export default ComingSoonActivities
