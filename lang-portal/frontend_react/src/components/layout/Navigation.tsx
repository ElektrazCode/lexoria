import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'The Great Hall', end: true },
  { to: '/lexicon', label: 'The Lexicon', end: false },
  { to: '/memory-scrolls', label: 'Memory Scrolls', end: false },
]

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'block border-b-2 px-1 py-2 font-display text-sm tracking-wide transition-colors',
    'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-parchment-300',
    isActive
      ? 'border-parchment-300 text-parchment-50'
      : 'border-transparent text-parchment-300 hover:text-parchment-50',
  ].join(' ')

/** Main navigation: always visible from `md` up, behind a toggle button on small screens. */
function Navigation() {
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
    <nav ref={navRef} aria-label="Main">
      <button
        ref={toggleRef}
        type="button"
        className="rounded border border-parchment-400/60 px-3 py-1.5 font-display text-sm text-parchment-100 hover:border-parchment-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-parchment-300 md:hidden"
        aria-expanded={open}
        aria-controls="main-menu"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? 'Close' : 'Menu'}
      </button>

      <ul
        id="main-menu"
        className={`${open ? 'mt-3 flex' : 'hidden'} flex-col gap-1 md:mt-0 md:flex md:flex-row md:gap-6`}
      >
        {links.map(({ to, label, end }) => (
          <li key={to}>
            <NavLink to={to} end={end} className={linkClass} onClick={() => setOpen(false)}>
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default Navigation
