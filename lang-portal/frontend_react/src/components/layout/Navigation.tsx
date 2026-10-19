import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import greatHallIcon from '@/assets/images/icon-great-hall.webp'
import lexiconIcon from '@/assets/images/icon-lexicon.webp'
import memoryScrollsIcon from '@/assets/images/icon-memory-scrolls.webp'

const links = [
  { to: '/', label: 'The Great Hall', end: true, icon: greatHallIcon },
  { to: '/lexicon', label: 'The Lexicon', end: false, icon: lexiconIcon },
  { to: '/memory-scrolls', label: 'Memory Scrolls', end: false, icon: memoryScrollsIcon },
]

const linkClass = (textHalo: string, scaled: boolean) => ({ isActive }: { isActive: boolean }) =>
  [
    'flex items-center gap-2.5 rounded-sm border-b-2 px-2 py-2 font-display text-base tracking-wide motion-safe:transition-colors xl:px-1',
    scaled ? 'xl:text-[1.25vw]' : 'xl:text-lg',
    textHalo,
    'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-300',
    isActive
      ? 'border-gold-400 text-gold-100'
      : 'border-transparent text-gold-300 hover:border-gold-500/60 hover:text-gold-100',
  ].join(' ')

/**
 * Main navigation: always visible from `xl` up, behind a toggle button (with a dropdown panel) below.
 * `xl` (1280px) is where the brand, tagline and all three icon links fit on one row with room to
 * spare (they need about 1160px); below it the compact Menu keeps the header on a single row.
 */
function Navigation({ textHalo = '', scaled = false }: { textHalo?: string; scaled?: boolean }) {
  const [open, setOpen] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  // Escape closes the open menu. The listener exists only while the menu is open.
  useEffect(() => {
    if (!open) return

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setOpen(false)
      // Hand focus back to the toggle only if it was in the menu (or nowhere, after a click on the
      // page background); never pull it out of something else, such as the Lexicon search box.
      const active = document.activeElement
      if (!active || active === document.body || navRef.current?.contains(active)) {
        toggleRef.current?.focus()
      }
    }

    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [open])

  return (
    <nav ref={navRef} aria-label="Main" className="relative">
      <button
        ref={toggleRef}
        type="button"
        className="rounded border border-gold-500 bg-burgundy-950/50 px-4 py-2 font-display text-sm text-gold-100 motion-safe:transition-colors hover:border-gold-300 hover:bg-burgundy-950/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300 xl:hidden"
        aria-expanded={open}
        aria-controls="main-menu"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? 'Close' : 'Menu'}
      </button>

      <ul
        id="main-menu"
        className={`${open ? 'flex' : 'hidden'} absolute right-0 top-full z-30 mt-3 min-w-52 flex-col gap-1 rounded border border-gold-500 bg-burgundy-950 p-2 shadow-lg shadow-burgundy-950/50 xl:static xl:mt-0 xl:flex xl:min-w-0 xl:flex-row ${scaled ? 'xl:gap-[1.6vw]' : 'xl:gap-6'} xl:border-0 xl:bg-transparent xl:p-0 xl:shadow-none`}
      >
        {links.map(({ to, label, end, icon }) => (
          <li key={to}>
            <NavLink to={to} end={end} className={linkClass(textHalo, scaled)} onClick={() => setOpen(false)}>
              <img src={icon} width={96} height={96} alt="" aria-hidden="true" className={`shrink-0 drop-shadow ${scaled ? 'size-8 xl:size-[2.1vw]' : 'size-8'}`} />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default Navigation
