import { useEffect, useRef } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import Navigation from './Navigation'

/** Shared page frame: skip link, header with navigation, routed content, footer. */
function Layout() {
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const lastPath = useRef(pathname)

  // A single-page app does not reload, so tell keyboard and screen-reader users that a new page
  // has loaded by moving focus to its heading. Skipped on first load and for same-page re-renders.
  useEffect(() => {
    if (lastPath.current === pathname) return
    lastPath.current = pathname
    mainRef.current?.querySelector<HTMLElement>('h1')?.focus()
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only rounded bg-parchment-50 px-4 py-2 font-display text-burgundy-700 focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10"
      >
        Skip to content
      </a>

      <header className="bg-burgundy-900 text-parchment-100">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-8 gap-y-2 px-4 py-4 sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-parchment-300"
          >
            <span
              aria-hidden="true"
              className="flex size-9 items-center justify-center rounded-full border border-parchment-300 text-xl text-parchment-300"
            >
              Λ
            </span>
            <span className="font-display text-xl font-bold tracking-wide">Gates of Lexoria</span>
          </Link>
          <Navigation />
        </div>
        <div aria-hidden="true" className="h-1 border-y border-parchment-300/40" />
      </header>

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
