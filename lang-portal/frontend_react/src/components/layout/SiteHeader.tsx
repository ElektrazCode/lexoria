import { Link } from 'react-router-dom'
import logoUrl from '@/assets/images/lexoria-logo.webp'
import Navigation from './Navigation'

// Soft dark halo that keeps gold text legible over the painted scene.
const sceneHalo = '[text-shadow:0_0_6px_var(--color-burgundy-950),0_1px_3px_var(--color-burgundy-950)]'

/**
 * Shared page header: the Λ logo, the title with its tagline, and the main navigation.
 *
 * `overlay` (the Great Hall) puts it over the painted drapery of the scene behind it: no bar, no
 * panel. The Great Hall frame never scrolls (only its content does), so the header stays put. The
 * drape is about 8.75% of the scaled painting; `--hall-header-h`, set by Layout, is that band.
 * Other pages have no scene, so they get a compact burgundy bar with gold trim.
 */
function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const halo = overlay ? sceneHalo : ''
  return (
    <header
      className={
        overlay
          ? 'absolute inset-x-0 top-0 z-10'
          : 'relative z-10 border-b-2 border-gold-400 bg-burgundy-900 shadow-md shadow-burgundy-950/30'
      }
    >
      <div
        className={`mx-auto flex flex-nowrap items-center justify-between gap-x-3 px-4 sm:gap-x-8 sm:px-6 ${
          overlay ? 'min-h-(--hall-header-h) max-w-[110rem] py-1 lg:px-[3.5vw] xl:items-start xl:px-[5vw]' : 'max-w-5xl py-3'
        }`}
      >
        <Link
          to="/"
          className={`flex min-w-0 shrink items-center gap-2.5 rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-300 sm:gap-3 lg:gap-4 ${overlay ? 'xl:mt-[1vw]' : ''}`}
        >
          <img
            src={logoUrl}
            width={160}
            height={155}
            alt=""
            aria-hidden="true"
            className={`w-auto drop-shadow-md ${overlay ? 'h-11 max-[23rem]:h-9 sm:h-14 lg:h-12 xl:h-[3.4vw]' : 'h-10 sm:h-12'}`}
          />
          <span className="flex flex-col">
            <span
              className={`font-display text-lg font-bold leading-tight tracking-wide text-gold-100 max-[23rem]:text-base sm:text-2xl ${
                overlay ? 'lg:text-2xl xl:text-[2vw]' : ''
              } ${halo}`}
            >
              Gates of Lexoria
            </span>
            <span
              aria-hidden="true"
              className={`hidden font-display text-[0.7rem] uppercase tracking-[0.18em] text-gold-100 xl:block xl:text-[max(0.65rem,0.72vw)] ${halo}`}
            >
              Learn Greek, one scroll at a time
            </span>
          </span>
        </Link>
        <div className={overlay ? 'xl:mt-[0.5vw]' : ''}>
          <Navigation textHalo={halo} scaled={overlay} />
        </div>
      </div>
    </header>
  )
}

export default SiteHeader
