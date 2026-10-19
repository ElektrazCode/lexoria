import ActivityPortals from '@/components/hall/ActivityPortals'
import HallTitle from '@/components/hall/HallTitle'
import Scoreboard from '@/components/hall/Scoreboard'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

// The Matching Hall and Scribe's Table are planned but not shown in the three-portal composition
// yet; their definitions stay in components/ComingSoonActivities.tsx.

function GreatHall() {
  useDocumentTitle('The Great Hall')

  return (
    // The scene itself: title over the arches, scoreboard over the bookshelf (upper-left on wide
    // screens, below the title on narrow ones), the three portals standing in the hall below.
    // The scroller starts below the header, and the first 2rem of it is the fade zone, so the first
    // screen keeps clear of it.
    <section
      aria-labelledby="hall-title"
      className="relative flex flex-col items-center gap-8 px-4 pb-[max(1.5rem,3dvh)] pt-[max(2rem,3dvh)] lg:block lg:pt-[max(2rem,calc(28dvh-var(--hall-header-h)))]"
    >
      <HallTitle />
      <div className="lg:absolute lg:left-[2vw] lg:top-[max(2rem,2.5dvh)]">
        <Scoreboard />
      </div>
      <div className="lg:mt-[3dvh]">
        <ActivityPortals />
      </div>
    </section>
  )
}

export default GreatHall
