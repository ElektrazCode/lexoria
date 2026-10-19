import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import HallBackdrop from '@/components/hall/HallBackdrop'
import SiteHeader from './SiteHeader'

const skipLinkClass =
  'sr-only rounded bg-parchment-50 px-4 py-2 font-display text-burgundy-700 focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-20 focus-visible:outline-gold-400'

/**
 * Shared page frame: skip link, header with navigation, routed content, optional footer.
 *
 * Most pages scroll normally under a compact header bar. The Great Hall is different: it is a
 * viewport-sized scene. The painting and the header are pinned to the viewport and the content
 * scrolls in a container of its own that starts below the drapery band, so it can never slide
 * underneath the transparent header (it fades out at the band's lower edge instead).
 */
function Layout() {
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const lastPath = useRef(pathname)
  const isHall = pathname === '/'

  // A single-page app does not reload, so tell keyboard and screen-reader users that a new page
  // has loaded by moving focus to its heading. Skipped on first load and for same-page re-renders.
  // On the Great Hall the first screen is the scene, so do not scroll the content to the heading.
  useEffect(() => {
    if (lastPath.current === pathname) return
    lastPath.current = pathname
    mainRef.current?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: pathname === '/' })
  }, [pathname])

  if (isHall) {
    return (
      <div className="relative isolate h-dvh overflow-hidden [--hall-header-h:max(5rem,6.5vw,8.75svh)]">
        <a href="#main-content" className={skipLinkClass}>
          Skip to content
        </a>

        <HallBackdrop />
        <SiteHeader overlay />

        {/* The scroller starts below the drapery band, so the browser never scrolls a focused element
            under the header; its top edge fades out softly */}
        <div className="absolute inset-x-0 bottom-0 top-(--hall-header-h) overflow-y-auto focus-visible:-outline-offset-4 focus-visible:outline-gold-300 overflow-x-hidden scroll-pt-10 scroll-pb-6 [mask-image:linear-gradient(to_bottom,transparent,#000_1.75rem)]">
          <main ref={mainRef} id="main-content" className="w-full">
            <Outlet />
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main-content" className={skipLinkClass}>
        Skip to content
      </a>

      <SiteHeader />

      <main ref={mainRef} id="main-content" className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        <Outlet />
      </main>

      <footer className="border-t border-parchment-300 py-6 text-center text-sm text-ink-600">
        Gates of Lexoria · Learn Greek, one scroll at a time
      </footer>
    </div>
  )
}

export default Layout
