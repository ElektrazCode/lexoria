import hallUrl from '@/assets/images/the-great-hall.webp'
import hallSmallUrl from '@/assets/images/the-great-hall-768.webp'

/**
 * The Great Hall as the environment of the whole page, edge to edge. It fills the Great Hall
 * frame, which is exactly one viewport tall and does not scroll (the content scrolls over it).
 *
 * The painting is 4:3 and is never stretched: `object-cover` scales it uniformly and crops. It is
 * pinned to the top so the painted drapery that the header sits on always stays in view; wider
 * screens lose floor, not drapery. Purely decorative.
 */
function HallBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <img
        src={hallUrl}
        srcSet={`${hallSmallUrl} 768w, ${hallUrl} 1448w`}
        sizes="max(100vw, 133vh)"
        width={1448}
        height={1086}
        alt=""
        fetchPriority="high"
        className="size-full object-cover object-top"
      />
    </div>
  )
}

export default HallBackdrop
